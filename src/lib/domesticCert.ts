import type { MaterialComposition } from '@/types/dpp';
import type {
  CertLifecycleState,
  CertScheme,
  DomesticCertification,
  DomesticOrigin,
  DomesticTrack,
  EvaluateInput,
  MarkIssue,
  MarkName,
  ProcessKey,
  ProcessSource,
  RatioBasis,
  RatioWarning,
  TrackVerdict,
  TriState,
  VerdictReasonCode
} from '@/types/domesticCert';

/**
 * 국산 섬유제품 인증 판정 엔진 (순수 함수 — React 의존 없음)
 *
 * 판정 기준은 섬산련 실제 제도의 트랙 방식을 따른다.
 *   T2 KOREA TEXTILE      = 원사 + 제직·편직 + 염가공            (원단)
 *   T1 KOREA PRODUCT      = 제직·편직 + 염가공 + 봉제            (완제품)
 *   T3 KOREA PRODUCT PLUS = 원사 + 제직·편직 + 염가공 + 봉제      (완제품, Yarn Forward)
 *
 * 핵심 규칙: null(미확인)을 false(국외)와 동일 취급하지 않는다.
 * 미확인은 '부적합'이 아니라 '판정 불가(자료 미비)'다.
 */

const PROCESS_KEYS: ProcessKey[] = ['yarn', 'weaving', 'dyeing', 'sewing'];

const ORIGIN_FIELD: Record<ProcessKey, keyof DomesticOrigin> = {
  yarn: 'is_domestic_yarn',
  weaving: 'is_domestic_weaving',
  dyeing: 'is_domestic_dyeing',
  sewing: 'is_domestic_sewing'
};

export const PROCESS_LABEL: Record<ProcessKey, string> = {
  yarn: '원사 방적',
  weaving: '제직·편직',
  dyeing: '염색·가공',
  sewing: '봉제'
};

const TRACK_META: Record<
  DomesticTrack,
  { ko: string; en: MarkName; scope: string; accent: 'emerald' | 'purple' | 'sky' }
> = {
  T1: {
    ko: '원단 → 완제품',
    en: 'KOREA PRODUCT',
    scope: '제직·편직 + 염색·가공 + 봉제',
    accent: 'emerald'
  },
  T2: {
    ko: '원사 → 원단',
    en: 'KOREA TEXTILE',
    scope: '원사 + 제직·편직 + 염색·가공',
    accent: 'purple'
  },
  T3: {
    ko: '원사 → 완제품 (Yarn Forward)',
    en: 'KOREA PRODUCT PLUS',
    scope: '원사 + 제직·편직 + 염색·가공 + 봉제',
    accent: 'sky'
  }
};

export function trackMeta(track: DomesticTrack) {
  return TRACK_META[track];
}

// ==============================================================================
// 1. 공정 플래그 해석
// ==============================================================================

/** undefined/null 은 건너뛰고 false 는 값으로 유지한다. */
function pick(...candidates: Array<TriState | undefined>): TriState {
  for (const c of candidates) {
    if (c === true || c === false) return c;
  }
  return null;
}

function readFlag(origin: DomesticOrigin | undefined | null, key: ProcessKey): TriState {
  if (!origin) return null;
  const raw = origin[ORIGIN_FIELD[key]];
  return raw === true || raw === false ? raw : null;
}

export function resolveProcessFlags(input: EvaluateInput): {
  flags: Record<ProcessKey, TriState>;
  source: Record<ProcessKey, ProcessSource>;
  hasFabricLink: boolean;
} {
  const { subjectType, fabric, passport, override } = input;

  const snapshotOrigin = passport?.fabric_snapshot?.domestic_origin ?? null;
  const hasFabricLink = Boolean(passport?.fabric_id || passport?.fabric_snapshot?.id);

  const flags = {} as Record<ProcessKey, TriState>;
  const source = {} as Record<ProcessKey, ProcessSource>;

  for (const key of PROCESS_KEYS) {
    // 봉제는 완제품 전용 공정이다.
    if (key === 'sewing' && subjectType === 'fabric') {
      flags[key] = null;
      source[key] = 'none';
      continue;
    }

    const fromOverride = readFlag(override, key);
    const fromPassport = subjectType === 'passport' ? readFlag(passport?.domestic_origin, key) : null;
    const fromFabric = readFlag(fabric?.domestic_origin, key);
    const fromSnapshot = subjectType === 'passport' ? readFlag(snapshotOrigin, key) : null;

    const value = pick(fromOverride, fromPassport, fromFabric, fromSnapshot);
    flags[key] = value;

    if (value === null) {
      source[key] = 'none';
    } else if (fromOverride !== null) {
      source[key] = 'override';
    } else if (fromPassport !== null) {
      source[key] = 'passport';
    } else {
      source[key] = 'fabric';
    }
  }

  return { flags, source, hasFabricLink };
}

// ==============================================================================
// 2. 국산 혼용률 (참고 지표 — 판정 조건 아님)
// ==============================================================================

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function computeDomesticRatio(input: EvaluateInput): {
  ratio: number | null;
  basis: RatioBasis;
  warning: RatioWarning;
} {
  const { subjectType, fabric, passport, override } = input;

  const comps: MaterialComposition[] =
    subjectType === 'passport'
      ? passport?.materials_summary?.length
        ? passport.materials_summary
        : passport?.fabric_snapshot?.composition ?? fabric?.composition ?? []
      : fabric?.composition ?? [];

  const valid = comps.filter(
    (c) => c && Number.isFinite(c.percentage) && (c.percentage as number) > 0
  );

  const flagged = valid.some((c) => typeof c.isDomestic === 'boolean');

  if (!flagged) {
    // 소재별 근거가 없으면 신고값으로만 폴백한다. 그것도 없으면 추정하지 않는다.
    const declared =
      override?.declaredDomesticRatio ??
      (subjectType === 'passport'
        ? passport?.domestic_origin?.declaredDomesticRatio
        : fabric?.domestic_origin?.declaredDomesticRatio);

    if (typeof declared === 'number' && Number.isFinite(declared)) {
      return { ratio: clamp(declared, 0, 100), basis: 'declared', warning: null };
    }
    return { ratio: null, basis: 'unavailable', warning: null };
  }

  const totalPct = valid.reduce((sum, c) => sum + (c.percentage as number), 0);
  if (totalPct <= 0) {
    return { ratio: null, basis: 'unavailable', warning: null };
  }

  const domesticPct = valid
    .filter((c) => c.isDomestic === true)
    .reduce((sum, c) => sum + (c.percentage as number), 0);

  // 합계가 100이 아니어도 실제 합계로 정규화하고, 사실은 경고로 알린다.
  const ratio = Math.round((domesticPct / totalPct) * 1000) / 10;
  const warning: RatioWarning =
    Math.abs(totalPct - 100) > 0.5 ? 'COMPOSITION_SUM_NOT_100' : null;

  return { ratio, basis: 'material_flags', warning };
}

// ==============================================================================
// 3. 트랙 판정
// ==============================================================================

function flagLabel(v: TriState): string {
  if (v === true) return '국내';
  if (v === false) return '국외';
  return '미확인';
}

function unknownProcessSummary(
  flags: Record<ProcessKey, TriState>,
  keys: ProcessKey[]
): string {
  return keys.map((k) => `${PROCESS_LABEL[k]}(${flagLabel(flags[k])})`).join(', ');
}

export function evaluateTrack(input: EvaluateInput): TrackVerdict {
  const { subjectType } = input;
  const { flags, source, hasFabricLink } = resolveProcessFlags(input);
  const { ratio, basis, warning } = computeDomesticRatio(input);

  const base = {
    processes: flags,
    processSource: source,
    domesticRatio: ratio,
    ratioBasis: basis,
    ratioWarning: warning,
    evaluatedAt: new Date().toISOString()
  };

  const ok = (track: DomesticTrack): TrackVerdict => ({
    ...base,
    track,
    eligible: true,
    reasonCode: 'OK',
    reason: `${TRACK_META[track].en} (${TRACK_META[track].scope}) 요건을 충족합니다.`,
    markName: TRACK_META[track].en
  });

  const fail = (reasonCode: VerdictReasonCode, reason: string): TrackVerdict => ({
    ...base,
    track: null,
    eligible: false,
    reasonCode,
    reason,
    markName: null
  });

  const { yarn: Y, weaving: W, dyeing: D, sewing: S } = flags;

  // ---- 원단(FabricDPP) → T2 KOREA TEXTILE ----
  if (subjectType === 'fabric') {
    if (Y === true && W === true && D === true) return ok('T2');
    if (Y === false)
      return fail('NOT_DOMESTIC_YARN', '원사 방적 공정이 국외로 선언되어 원단 트랙(T2) 요건을 충족하지 않습니다.');
    if (W === false)
      return fail('NOT_DOMESTIC_WEAVING', '제직·편직 공정이 국외로 선언되어 원단 트랙(T2) 요건을 충족하지 않습니다.');
    if (D === false)
      return fail('NOT_DOMESTIC_DYEING', '염색·가공 공정이 국외로 선언되어 원단 트랙(T2) 요건을 충족하지 않습니다.');
    return fail(
      'INSUFFICIENT_DATA',
      `${unknownProcessSummary(flags, ['yarn', 'weaving', 'dyeing'])} — 미확인 공정이 있어 트랙 판정이 불가합니다.`
    );
  }

  // ---- 완제품(FashionDPP) → T3 / T1 ----
  if (!hasFabricLink && W === null && D === null) {
    return fail(
      'NO_FABRIC_LINK',
      '연결된 원단 DPP가 없어 제직·편직 및 염색·가공 공정의 국내 생산 여부를 확인할 수 없습니다. 원단을 연동하거나 공정 정보를 직접 선언해 주세요.'
    );
  }

  // 상위 트랙(T3)부터 평가한다.
  if (Y === true && W === true && D === true && S === true) return ok('T3');
  // T1은 원사 구간을 커버하지 않으므로 Y가 false/null이어도 성립한다.
  if (W === true && D === true && S === true) return ok('T1');

  // 부적합 사유는 후공정부터 보고한다 — 신청자가 고칠 지점을 가장 직접적으로 알려준다.
  if (S === false)
    return fail('NOT_DOMESTIC_SEWING', '봉제 공정이 국외로 선언되어 완제품 트랙(T1/T3) 요건을 충족하지 않습니다.');
  if (W === false)
    return fail('NOT_DOMESTIC_WEAVING', '제직·편직 공정이 국외로 선언되어 완제품 트랙(T1/T3) 요건을 충족하지 않습니다.');
  if (D === false)
    return fail('NOT_DOMESTIC_DYEING', '염색·가공 공정이 국외로 선언되어 완제품 트랙(T1/T3) 요건을 충족하지 않습니다.');

  return fail(
    'INSUFFICIENT_DATA',
    `${unknownProcessSummary(flags, ['weaving', 'dyeing', 'sewing'])} — 미확인 공정이 있어 트랙 판정이 불가합니다.`
  );
}

// ==============================================================================
// 3-b. 제품 단위 국산 공정 요약 (인증과 무관한 DPP 자체 데이터)
// ==============================================================================

/**
 * 제품/원단이 실제로 보유한 국산 공정 이력을 그대로 요약한다.
 *
 * 🔴 트랙(T1/T2/T3)을 붙이지 않는다. 트랙은 업체가 심사받아 보유하는 인증의 속성이지
 *    제품의 속성이 아니다. 제품 화면에 트랙을 찍으면 "이 제품이 인증받았다"로 읽힌다.
 *    제품 화면에서는 공정별 국내/국외/미확인 사실만 보여주고,
 *    인증 어휘(트랙·마크·인증번호)는 /cert 계열에서만 쓴다.
 */
export interface DomesticProcessSummary {
  processes: Record<ProcessKey, TriState>;
  processSource: Record<ProcessKey, ProcessSource>;
  /** 이 대상에서 의미 있는 공정 (원단은 봉제를 제외한 3개) */
  stages: ProcessKey[];
  domesticCount: number;
  foreignCount: number;
  unknownCount: number;
  hasFabricLink: boolean;
  domesticRatio: number | null;
  ratioBasis: 'material_flags' | 'declared' | 'unavailable';
  ratioWarning: 'COMPOSITION_SUM_NOT_100' | null;
}

export function summarizeDomesticProcesses(input: EvaluateInput): DomesticProcessSummary {
  const { flags, source, hasFabricLink } = resolveProcessFlags(input);
  const { ratio, basis, warning } = computeDomesticRatio(input);
  const stages: ProcessKey[] =
    input.subjectType === 'fabric'
      ? ['yarn', 'weaving', 'dyeing']
      : ['yarn', 'weaving', 'dyeing', 'sewing'];

  return {
    processes: flags,
    processSource: source,
    stages,
    domesticCount: stages.filter((s) => flags[s] === true).length,
    foreignCount: stages.filter((s) => flags[s] === false).length,
    unknownCount: stages.filter((s) => flags[s] === null).length,
    hasFabricLink,
    domesticRatio: ratio,
    ratioBasis: basis,
    ratioWarning: warning
  };
}

// ==============================================================================
// 4. 인증 생애주기
// ==============================================================================

/** 계약기간 2년 */
export function addTwoYears(fromISO: string): string {
  const d = new Date(fromISO);
  const target = new Date(d.getTime());
  target.setFullYear(target.getFullYear() + 2);
  return target.toISOString();
}

export function documentTitle(scheme: CertScheme): '인증서' | '확인서' {
  return scheme === 'third_party' ? '인증서' : '확인서';
}

export function schemeLabel(scheme: CertScheme): string {
  return scheme === 'third_party' ? '제3자 인증 (현장심사)' : '기업자율인증 (자기적합성선언)';
}

/**
 * 만료는 status가 아니라 읽기 시점에 계산한다.
 * 정적 export 앱에는 상태 전이를 실행할 스케줄러가 없기 때문이다.
 */
export function certLifecycleState(
  cert: DomesticCertification,
  now: Date = new Date()
): CertLifecycleState {
  if (cert.status === 'revoked') return 'revoked';
  if (cert.status === 'rejected') return 'rejected';
  if (cert.status === 'draft') return 'draft';
  if (cert.status === 'submitted' || cert.status === 'under_review' || cert.status === 'approved') {
    return 'in_review';
  }
  // issued
  if (cert.valid_until) {
    const until = new Date(cert.valid_until);
    if (Number.isFinite(until.getTime()) && until.getTime() < now.getTime()) return 'expired';
  }
  return 'active';
}

export function isCertActive(cert: DomesticCertification, now: Date = new Date()): boolean {
  return certLifecycleState(cert, now) === 'active';
}

export const LIFECYCLE_LABEL: Record<CertLifecycleState, string> = {
  draft: '작성 중',
  in_review: '심사중',
  active: '유효',
  expired: '계약기간 만료',
  rejected: '반려',
  revoked: '취소'
};

// ==============================================================================
// 5. 업체 인증 ↔ 마크 발급 연계
// ==============================================================================

/** 해당 업체 인증이 지금 마크를 발급할 수 있는 상태인지 */
export function canIssueMark(
  cert: DomesticCertification,
  track: DomesticTrack,
  now: Date = new Date()
): { ok: boolean; reason: string } {
  const state = certLifecycleState(cert, now);
  if (state !== 'active') {
    return {
      ok: false,
      reason: `업체 인증이 '${LIFECYCLE_LABEL[state]}' 상태입니다. 계약이 유효한 인증기업만 마크를 발급받을 수 있습니다.`
    };
  }
  if (!cert.approved_tracks?.includes(track)) {
    const have = cert.approved_tracks?.length ? cert.approved_tracks.join(', ') : '없음';
    return {
      ok: false,
      reason: `이 업체가 승인받은 트랙은 ${have} 입니다. ${track} 마크를 발급하려면 해당 트랙으로 재계약(적격성 심사)이 필요합니다.`
    };
  }
  return { ok: true, reason: `${track} ${trackMeta(track).en} 마크 발급 가능` };
}

/** 마크가 지금 유효한지 — 마크 자체 상태 + 상위 업체 인증 상태를 함께 본다. */
export type MarkLifecycleState = 'requested' | 'valid' | 'revoked' | 'cert_expired' | 'cert_revoked';

export function markLifecycleState(
  mark: MarkIssue,
  cert: DomesticCertification | null | undefined,
  now: Date = new Date()
): MarkLifecycleState {
  if (mark.status === 'revoked') return 'revoked';
  if (mark.status === 'requested') return 'requested';
  // 업체 인증이 만료·취소되면 그 아래 마크도 효력을 잃는다.
  if (cert) {
    const s = certLifecycleState(cert, now);
    if (s === 'revoked' || s === 'rejected') return 'cert_revoked';
    if (s === 'expired') return 'cert_expired';
  }
  return 'valid';
}

export const MARK_LIFECYCLE_LABEL: Record<MarkLifecycleState, string> = {
  requested: '발급 신청 중',
  valid: '유효',
  revoked: '마크 회수',
  cert_expired: '업체 계약기간 만료',
  cert_revoked: '업체 인증 취소'
};
