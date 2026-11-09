import type { FabricDPP, FashionDPP } from './dpp';

/** 3-state. true=국내 생산, false=국외 생산, null=미확인(기존 데이터 포함) */
export type TriState = boolean | null;

export type ProcessKey = 'yarn' | 'weaving' | 'dyeing' | 'sewing';

export interface ProcessDetail {
  companyName?: string;
  location?: string;
  processDate?: string; // YYYY-MM-DD
}

export interface DomesticEvidence {
  type: 'tax_invoice' | 'transaction_certificate' | 'lot_record' | 'test_report' | 'other';
  label: string;
  refNo?: string;
  issuedDate?: string;
  issuer?: string;
}

/**
 * dpp_fabrics.domestic_origin / dpp_passports.domestic_origin 의 형상.
 * 값이 없으면(undefined/null) '미확인'이며, 절대 '국외(false)'로 해석하지 않는다.
 */
export interface DomesticOrigin {
  is_domestic_yarn?: TriState;
  is_domestic_weaving?: TriState;
  is_domestic_dyeing?: TriState;
  /** 완제품 전용. 원단(FabricDPP)에서는 사용하지 않는다. */
  is_domestic_sewing?: TriState;
  processes?: Partial<Record<ProcessKey, ProcessDetail>>;
  /** 소재별 isDomestic 플래그가 없을 때만 사용하는 신고 국산 혼용률(참고 지표) */
  declaredDomesticRatio?: number | null;
  evidence?: DomesticEvidence[];
  note?: string;
}

export type RatioBasis = 'material_flags' | 'declared' | 'unavailable';
export type RatioWarning = 'COMPOSITION_SUM_NOT_100' | null;

export type ProcessSource = 'passport' | 'fabric' | 'override' | 'none';

/** 공정 요약 입력. override는 폼에서 편집 중인 미저장 값(실시간 프리뷰용). */
export interface EvaluateInput {
  subjectType: 'fabric' | 'passport';
  fabric?: FabricDPP | null;
  passport?: FashionDPP | null;
  override?: DomesticOrigin | null;
}

export type Industry = 'fashion' | 'school' | 'sports' | 'bedding' | 'fabric' | 'etc';

export const INDUSTRY_LABEL: Record<Industry, string> = {
  fashion: '패션',
  school: '학생복',
  sports: '운동복',
  bedding: '침구류',
  fabric: '직물류',
  etc: '기타'
};

// ==============================================================================
// 업체 마스터 — 원단/완제품의 소유자이자 향후 계정·권한(RLS)의 기준 키
// ==============================================================================

export type CompanyRole = 'fabric_supplier' | 'manufacturer';

export interface Company {
  id: string; // CMP-2026-8F3A21C9
  name: string;
  /** 사업자등록번호. 숫자만 추출한 값에 UNIQUE 인덱스가 걸려 중복 등록이 차단된다. */
  biz_no?: string | null;
  representative?: string | null;
  address?: string | null;
  contact?: string | null;
  industry?: Industry | null;
  roles: CompanyRole[];
  note?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type MemberRole = 'owner' | 'manager' | 'staff';
export type MemberStatus = 'invited' | 'active' | 'disabled';

/** 업체 담당자 계정. Supabase Auth 도입 시 RLS 판정의 근거가 된다. */
export interface CompanyMember {
  id: string;
  company_id: string;
  user_id?: string | null;
  email?: string | null;
  role: MemberRole;
  status: MemberStatus;
  created_at?: string;
  updated_at?: string;
}

/** 업체명 정규화 — 앞뒤 공백 제거 + 연속 공백 1칸. DB 인덱스와 같은 규칙. */
export function normalizeCompanyName(name: string): string {
  return (name || '').trim().replace(/\s+/g, ' ');
}

/** 사업자등록번호에서 숫자만 추출 — DB UNIQUE 인덱스와 같은 규칙. */
export function normalizeBizNo(bizNo?: string | null): string {
  return (bizNo || '').replace(/[^0-9]/g, '');
}
