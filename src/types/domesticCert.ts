import type { FabricDPP, FashionDPP } from './dpp';

/**
 * 국산 섬유제품 인증제도 (한국섬유산업연합회 / KOFOTI) 도메인 타입
 *
 * 밸류체인 5단계: 원사 → 제직·편직 → 염색·가공 → 봉제 → 패션제품
 * 트랙 T1 KOREA PRODUCT      = 제직·편직 + 염가공 + 봉제  (원단→완제품)
 * 트랙 T2 KOREA TEXTILE      = 원사 + 제직·편직 + 염가공  (원사→원단)
 * 트랙 T3 KOREA PRODUCT PLUS = 원사 + 제직·편직 + 염가공 + 봉제 (Yarn Forward)
 */

/** 3-state. true=국내 생산, false=국외 생산, null=미확인(기존 데이터 포함) */
export type TriState = boolean | null;

export type DomesticTrack = 'T1' | 'T2' | 'T3';

/** third_party=제3자 인증(현장실사→인증서), self_declaration=기업자율인증(자기적합성선언→확인서) */
export type CertScheme = 'third_party' | 'self_declaration';

/**
 * 'expired'는 의도적으로 없다. 정적 export 앱에는 상태 전이를 실행할 스케줄러가 없으므로
 * 만료는 읽기 시점에 valid_until 기준으로 계산한다 (certLifecycleState 참조).
 */
export type CertStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'issued'
  | 'rejected'
  | 'revoked';

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

export type VerdictReasonCode =
  | 'OK'
  | 'NO_FABRIC_LINK'
  | 'INSUFFICIENT_DATA'
  | 'NOT_DOMESTIC_YARN'
  | 'NOT_DOMESTIC_WEAVING'
  | 'NOT_DOMESTIC_DYEING'
  | 'NOT_DOMESTIC_SEWING';

export type RatioBasis = 'material_flags' | 'declared' | 'unavailable';
export type RatioWarning = 'COMPOSITION_SUM_NOT_100' | null;

export type MarkName = 'KOREA TEXTILE' | 'KOREA PRODUCT' | 'KOREA PRODUCT PLUS';

export type ProcessSource = 'passport' | 'fabric' | 'override' | 'none';

export interface TrackVerdict {
  track: DomesticTrack | null;
  eligible: boolean;
  reasonCode: VerdictReasonCode;
  /** 사용자에게 그대로 노출되는 한국어 사유 문구 */
  reason: string;
  markName: MarkName | null;
  processes: Record<ProcessKey, TriState>;
  processSource: Record<ProcessKey, ProcessSource>;
  /** 국산 혼용률(%). 판정 조건이 아니라 참고 지표다. 근거가 없으면 null. */
  domesticRatio: number | null;
  ratioBasis: RatioBasis;
  ratioWarning: RatioWarning;
  evaluatedAt: string; // ISO
}

/** 국가 강제 기준 — 「전기용품 및 생활용품 안전관리법」 */
export interface QualityDeclaration {
  /** 제23조 공급자적합성확인 등 */
  esaArticle23: boolean;
  /** 제46조 유해성평가 결과의 반영 */
  esaArticle46: boolean;
  reportNo?: string;
  reportDate?: string;
  testingLab?: string;
  /** 상표법 시행규칙 제28조 제1항 상품류 구분 (23=직물용 실, 24=직물 및 대용품, 25=의류·신발·모자) */
  productClass?: '23' | '24' | '25';
}

/** 제도 진행절차 7단계 중 심사원이 확인하는 항목 */
export interface ReviewChecklist {
  docReview?: boolean;   // 서류심사
  feePaid?: boolean;     // 수수료 납부
  siteAudit?: boolean;   // 현장심사
  eligibility?: boolean; // 적격성 검토
  contract?: boolean;    // 계약체결
}

/** 계약업체 업종 분류 (섬산련 보고서 기준: 패션1·학생복66·운동복27·침구류6·직물류21·기타2) */
export type Industry = 'fashion' | 'school' | 'sports' | 'bedding' | 'fabric' | 'etc';

export const INDUSTRY_LABEL: Record<Industry, string> = {
  fashion: '패션',
  school: '학생복',
  sports: '운동복',
  bedding: '침구류',
  fabric: '직물류',
  etc: '기타'
};

/** 현장심사에서 확인하는 업체 생산 역량 근거 */
export interface CapabilityEvidence {
  factories?: Array<{ name: string; location: string; process?: string }>;
  representativeSubjectIds?: string[]; // 심사 근거로 제출한 대표 제품/원단
  note?: string;
}

/**
 * 【1계층】 업체 인증 — 1 업체 = 1 인증 (계약기간 2년).
 *
 * 섬산련 제도는 제품이 아니라 **업체**를 인증한다:
 * "인증기업수 58개사 → 123개사", "계약업체 총 123개사", "계약기간 2년",
 * "진행절차 … → 계약체결 → 마크발급 신청".
 * 제품은 이 인증 아래에서 MarkIssue 로 연결된다.
 */
export interface DomesticCertification {
  id: string;                  // APP-2026-8F3A21C9
  cert_no?: string | null;     // K-TEX-2026-0001 (계약체결 후 부여)

  /** 소유 업체(dpp_companies.id). company_name 은 발급 시점 표기 스냅샷이고 이 값이 정본이다. */
  company_id?: string | null;
  company_name: string;
  biz_no?: string;
  representative?: string;
  address?: string;
  contact?: string;
  industry?: Industry;

  scheme: CertScheme;
  /** 업체가 신청/승인받은 트랙. 한 업체가 복수 트랙을 보유할 수 있다. */
  requested_tracks: DomesticTrack[];
  approved_tracks: DomesticTrack[];
  /** 상표법 시행규칙 제28조1항 상품류 */
  product_classes: Array<'23' | '24' | '25'>;

  status: CertStatus;
  quality_declaration: QualityDeclaration | Record<string, never>;
  capability_evidence: CapabilityEvidence | Record<string, never>;
  review_checklist: ReviewChecklist;

  reviewer_name?: string | null;
  reviewer_org?: string | null;
  reviewed_at?: string | null;
  reject_reason?: string | null;
  revoke_reason?: string | null;
  issued_at?: string | null;
  valid_until?: string | null;   // 계약기간 2년
  previous_cert_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type MarkStatus = 'requested' | 'issued' | 'revoked';

/** 마크 전달 형태. 2024.10.17 운영규정 개정으로 QR코드·띠지가 추가됐다. */
export type MarkCarrier = 'hangtag' | 'band' | 'qr';

export const MARK_CARRIER_LABEL: Record<MarkCarrier, string> = {
  hangtag: '지류 행택',
  band: '띠지',
  qr: 'QR코드'
};

/**
 * 【2계층】 마크 발급 — 인증기업이 계약 체결 후 트랙별로 발급번호를 받아 매수 단위로 공급받는다.
 * "마크발급: 인증기관의 발급번호 부여 후, 지정 인쇄소에서 발급" (발급현황 단위: 천매/년)
 *
 * 🔴 마크는 '업체'에 발행된다 — 제품과 직접 연결되지 않는다.
 *    "제조기업이 … 이를 인정하는 국산 섬유제품 인증서·확인서 및 마크를 발행"
 *    업체가 발급받은 마크를 자사 제품에 부착하는 구조이므로 subject_id 같은 제품 참조를 두지 않는다.
 *    제품 단위 추적은 DPP(패션/원단 여권)가 담당한다.
 */
export interface MarkIssue {
  id: string;                  // MRK-2026-3A9C21E8
  mark_no?: string | null;     // KTM-2026-00001
  cert_id: string;             // 발행 대상 업체의 인증

  track: DomesticTrack;
  carrier: MarkCarrier;
  quantity: number;            // 발급 매수
  printer?: string;            // 지정 인쇄소

  status: MarkStatus;
  revoke_reason?: string | null;
  issued_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CertReviewEventType =
  | 'submitted'
  | 'doc_review'
  | 'fee_paid'
  | 'site_audit'
  | 'approved'
  | 'issued'
  | 'rejected'
  | 'revoked'
  | 'renewed'
  | 'post_market_check'
  | 'mark_issued'
  | 'mark_revoked';

export interface CertReviewEvent {
  id: string;
  cert_id: string;
  event: CertReviewEventType;
  actor_name: string;
  actor_org?: string;
  actor_role: string;
  comment?: string;
  payload?: Record<string, any>;
  created_at: string;
}

/** 읽기 시점에 계산되는 인증 생애주기 상태 */
export type CertLifecycleState =
  | 'draft'
  | 'in_review'
  | 'active'
  | 'expired'
  | 'rejected'
  | 'revoked';

/** 판정 엔진 입력. override는 폼에서 편집 중인 미저장 값(실시간 프리뷰용). */
export interface EvaluateInput {
  subjectType: 'fabric' | 'passport';
  fabric?: FabricDPP | null;
  passport?: FashionDPP | null;
  override?: DomesticOrigin | null;
}

// ==============================================================================
// 업체 마스터 — 원단/완제품/국산인증의 소유자이자 향후 계정·권한(RLS)의 기준 키
// ==============================================================================

export type CompanyRole = 'fabric_supplier' | 'manufacturer';

export interface Company {
  id: string;              // CMP-2026-8F3A21C9
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
