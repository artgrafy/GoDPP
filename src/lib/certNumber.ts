import { supabase, getCertifications } from './supabase';

/**
 * 국산 섬유제품 인증번호 채번.
 *
 * 이 프로젝트는 output:'export' 정적 빌드라 API 라우트가 없다.
 * 대신 Postgres의 SECURITY DEFINER 함수를 브라우저에서 RPC로 호출해
 * 서버 코드 없이도 원자적 시퀀스를 얻는다.
 *
 * 기존 코드의 `Math.random()` + `upsert` 패턴은 여기서 쓰지 않는다 —
 * 충돌 시 남의 인증서를 조용히 덮어쓰기 때문이다.
 */

const CERT_NO_RE = /^K-TEX-(\d{4})-L?(\d+)$/;

function format(year: number, seq: number, local = false): string {
  return `K-TEX-${year}-${local ? 'L' : ''}${String(seq).padStart(4, '0')}`;
}

function randToken(): string {
  const source =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  return source.replace(/-/g, '').slice(0, 8).toUpperCase();
}

/** 업체 인증 신청 ID. PK 충돌은 upsert 덮어쓰기로 이어지므로 충분히 큰 공간을 쓴다. */
export function newApplicationId(year: number = new Date().getFullYear()): string {
  return `APP-${year}-${randToken()}`;
}

/** 마크 발급 ID */
export function newMarkId(year: number = new Date().getFullYear()): string {
  return `MRK-${year}-${randToken()}`;
}

/** 로컬 + 원격에 이미 존재하는 인증번호에서 해당 연도의 최대 시퀀스를 찾는다. */
async function maxKnownSeq(year: number): Promise<number> {
  let max = 0;
  try {
    const all = await getCertifications();
    for (const c of all) {
      const m = c.cert_no ? CERT_NO_RE.exec(c.cert_no) : null;
      if (m && Number(m[1]) === year) {
        max = Math.max(max, Number(m[2]));
      }
    }
  } catch {
    // 조회 실패 시 0에서 시작한다 (아래에서 중복 확인 후 재시도한다).
  }
  return max;
}

async function certNoTaken(certNo: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase
      .from('dpp_kofoti_certifications')
      .select('cert_no')
      .eq('cert_no', certNo)
      .maybeSingle();
    return !error && Boolean(data);
  } catch {
    return false;
  }
}

/**
 * 인증번호를 예약한다.
 * 1순위: Postgres RPC(원자적). 2순위: 최대값 탐색 + 중복 확인 재시도.
 * 최종 실패 시 'L' 접두(오프라인 채번)를 붙여 사후 식별이 가능하게 한다.
 */
export async function reserveCertNo(year: number = new Date().getFullYear()): Promise<string> {
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('next_kofoti_cert_seq', { p_year: year });
      if (!error && typeof data === 'number' && data > 0) {
        return format(year, data);
      }
      if (error) {
        console.warn('[GoDPP] next_kofoti_cert_seq RPC 실패, 폴백 채번으로 전환:', error.message);
      }
    } catch (err: any) {
      console.warn('[GoDPP] next_kofoti_cert_seq RPC 예외:', err?.message || err);
    }
  }

  let seq = (await maxKnownSeq(year)) + 1;
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = format(year, seq);
    if (!(await certNoTaken(candidate))) {
      return candidate;
    }
    seq += 1;
  }

  return format(year, seq, true);
}

/** 오프라인 채번(‘L’ 접두)으로 발급된 번호인지 — UI 경고 배지용 */
export function isLocallyAssignedCertNo(certNo?: string | null): boolean {
  return Boolean(certNo && /^K-TEX-\d{4}-L\d+$/.test(certNo));
}

// ==============================================================================
// 마크 발급번호 (KTM-2026-00001)
//
// "마크발급: 인증기관의 발급번호 부여 후, 지정 인쇄소에서 발급"
// 업체 인증번호(K-TEX-)와 별개 시퀀스다 — 업체 1곳이 제품별로 여러 마크를 발급받는다.
// ==============================================================================

const MARK_NO_RE = /^KTM-(\d{4})-L?(\d+)$/;

function formatMark(year: number, seq: number, local = false): string {
  return `KTM-${year}-${local ? 'L' : ''}${String(seq).padStart(5, '0')}`;
}

async function maxKnownMarkSeq(year: number): Promise<number> {
  let max = 0;
  try {
    const { getMarkIssues } = await import('./supabase');
    for (const m of await getMarkIssues()) {
      const g = m.mark_no ? MARK_NO_RE.exec(m.mark_no) : null;
      if (g && Number(g[1]) === year) max = Math.max(max, Number(g[2]));
    }
  } catch {
    // 조회 실패 시 0에서 시작하고 아래 중복 확인으로 보정한다.
  }
  return max;
}

async function markNoTaken(markNo: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase
      .from('dpp_kofoti_mark_issues')
      .select('mark_no')
      .eq('mark_no', markNo)
      .maybeSingle();
    return !error && Boolean(data);
  } catch {
    return false;
  }
}

export async function reserveMarkNo(year: number = new Date().getFullYear()): Promise<string> {
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('next_kofoti_mark_seq', { p_year: year });
      if (!error && typeof data === 'number' && data > 0) return formatMark(year, data);
      if (error) {
        console.warn('[GoDPP] next_kofoti_mark_seq RPC 실패, 폴백 채번으로 전환:', error.message);
      }
    } catch (err: any) {
      console.warn('[GoDPP] next_kofoti_mark_seq RPC 예외:', err?.message || err);
    }
  }

  let seq = (await maxKnownMarkSeq(year)) + 1;
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = formatMark(year, seq);
    if (!(await markNoTaken(candidate))) return candidate;
    seq += 1;
  }
  return formatMark(year, seq, true);
}

/** 오프라인 채번('L' 접두)으로 발급된 마크번호인지 */
export function isLocallyAssignedMarkNo(markNo?: string | null): boolean {
  return Boolean(markNo && /^KTM-\d{4}-L\d+$/.test(markNo));
}
