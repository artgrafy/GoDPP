-- ==============================================================================
-- GoDPP 「국산 섬유제품 인증제도」 구조 정정: 제품 단위 → 업체(기업) 단위
--
-- 【정정 근거 — 섬산련 운영현황 보고(2026.2.12)】
--   · "인증기업수 : ('22) 58개사 → ('25) 123개사"        → 인증 단위가 '개사'(업체)
--   · "계약업체 총 123개사", "계약기간 2년"                → 계약 주체가 업체
--   · "진행절차: … → 계약체결 → 마크발급 신청"             → 업체 계약이 먼저,
--                                                          마크 발급은 그 뒤 별도 단계
--   · "인증기업은 … 현장심사 기반 적합성 평가"             → 사후관리 대상이 기업
--   · "인증기업의 제품 또는 확인기업이 적합성 선언을 한 제품" → 기업이 주체, 제품은 그 아래
--   · "마크발급: 발급번호 부여 후 지정 인쇄소에서 발급"     → 마크는 매수 단위 발급
--       발급현황(천매/년): 2,547('22) → 884('23) → 565('24) → 1,930('25)
--
-- 【구조】
--   1계층 dpp_kofoti_certifications  : 업체 인증 (1 업체 = 1 인증, 2년 계약)
--   2계층 dpp_kofoti_mark_issues     : 마크 발급 (인증기업이 트랙별·제품별로 N건)
--
-- 【주의】 20260905 마이그레이션의 인증 테이블을 재생성한다.
--          해당 스키마는 실운용 데이터 없이 검증만 거친 상태(0행)이므로 DROP 후 재생성한다.
--          dpp_fabrics / dpp_passports / dpp_audit_logs 는 건드리지 않는다.
-- ==============================================================================

DROP TABLE IF EXISTS public.dpp_kofoti_cert_reviews   CASCADE;
DROP TABLE IF EXISTS public.dpp_kofoti_certifications CASCADE;

-- ------------------------------------------------------------------------------
-- 1. 업체 인증 (1계층)
-- ------------------------------------------------------------------------------
CREATE TABLE public.dpp_kofoti_certifications (
    id                  TEXT PRIMARY KEY,                   -- 신청 ID (예: APP-2026-8F3A21C9)
    cert_no             TEXT UNIQUE,                        -- 업체 인증번호 (예: K-TEX-2026-0001)

    -- 인증 주체: 업체
    company_name        TEXT NOT NULL,                      -- 인증기업명
    biz_no              TEXT,                               -- 사업자등록번호
    representative      TEXT,                               -- 대표자
    address             TEXT,                               -- 소재지 (현장심사 대상)
    contact             TEXT,                               -- 담당자 연락처
    -- 원본 보고서의 계약업체 업종 분류 (패션/학생복/운동복/침구류/직물류/기타)
    industry            TEXT CHECK (industry IN ('fashion','school','sports','bedding','fabric','etc')),

    scheme              TEXT NOT NULL CHECK (scheme IN ('third_party','self_declaration')),
    -- 업체가 신청/승인받은 트랙 목록. 한 업체가 T1·T3 등 복수 트랙을 보유할 수 있다.
    requested_tracks    JSONB NOT NULL DEFAULT '[]'::jsonb, -- ["T1","T3"]
    approved_tracks     JSONB NOT NULL DEFAULT '[]'::jsonb, -- 승인된 트랙(마크 발급 가능 범위)
    -- 상표법 시행규칙 제28조1항 상품류 (23=직물용 실 / 24=직물 및 대용품 / 25=의류·신발·모자)
    product_classes     JSONB NOT NULL DEFAULT '[]'::jsonb, -- ["24","25"]

    status              TEXT NOT NULL DEFAULT 'submitted'
                        CHECK (status IN ('draft','submitted','under_review','approved','issued','rejected','revoked')),
    quality_declaration JSONB NOT NULL DEFAULT '{}'::jsonb, -- 전안법 제23조/제46조 선언
    capability_evidence JSONB NOT NULL DEFAULT '{}'::jsonb, -- 현장심사 근거(생산설비·대표품목·공정 등)
    review_checklist    JSONB NOT NULL DEFAULT '{}'::jsonb, -- 서류심사/수수료/현장심사/적격성/계약체결

    reviewer_name       TEXT,
    reviewer_org        TEXT DEFAULT '한국섬유산업연합회(섬산련)',
    reviewed_at         TIMESTAMPTZ,
    reject_reason       TEXT,
    revoke_reason       TEXT,
    issued_at           TIMESTAMPTZ,
    valid_until         TIMESTAMPTZ,                        -- 계약기간 2년
    previous_cert_id    TEXT REFERENCES public.dpp_kofoti_certifications(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dpp_kofoti_cert_status  ON public.dpp_kofoti_certifications(status);
CREATE INDEX idx_dpp_kofoti_cert_company ON public.dpp_kofoti_certifications(company_name);
CREATE INDEX idx_dpp_kofoti_cert_created ON public.dpp_kofoti_certifications(created_at DESC);

COMMENT ON TABLE public.dpp_kofoti_certifications IS
    '국산 섬유제품 인증 — 업체 단위. 1 업체 = 1 인증(계약 2년). 제품은 dpp_kofoti_mark_issues 로 연결.';

-- ------------------------------------------------------------------------------
-- 2. 마크 발급 (2계층) — 인증기업이 트랙별·제품별로 발급받는 마크
-- ------------------------------------------------------------------------------
CREATE TABLE public.dpp_kofoti_mark_issues (
    id              TEXT PRIMARY KEY,                       -- MRK-2026-3A9C21E8
    mark_no         TEXT UNIQUE,                            -- 발급번호 (예: KTM-2026-00001)
    cert_id         TEXT NOT NULL REFERENCES public.dpp_kofoti_certifications(id) ON DELETE CASCADE,

    track           TEXT NOT NULL CHECK (track IN ('T1','T2','T3')),
    subject_type    TEXT NOT NULL CHECK (subject_type IN ('fabric','passport')),
    subject_id      TEXT NOT NULL,                          -- FAB-... / DPP-...
    subject_name    TEXT,

    quantity        INTEGER NOT NULL DEFAULT 0,             -- 발급 매수 (보고서 통계 단위: 천매/년)
    printer         TEXT,                                   -- 지정 인쇄소
    domestic_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,   -- 발급 시점 공정 플래그 동결
    evaluation        JSONB NOT NULL DEFAULT '{}'::jsonb,   -- 트랙 판정 결과 동결(TrackVerdict)

    status          TEXT NOT NULL DEFAULT 'issued'
                    CHECK (status IN ('requested','issued','revoked')),
    revoke_reason   TEXT,
    issued_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dpp_kofoti_mark_cert    ON public.dpp_kofoti_mark_issues(cert_id);
CREATE INDEX idx_dpp_kofoti_mark_subject ON public.dpp_kofoti_mark_issues(subject_id);
CREATE INDEX idx_dpp_kofoti_mark_created ON public.dpp_kofoti_mark_issues(created_at DESC);

COMMENT ON TABLE public.dpp_kofoti_mark_issues IS
    '마크 발급 — 인증기업이 계약 체결 후 트랙별·제품별로 발급번호를 부여받아 제품에 부착.';

-- ------------------------------------------------------------------------------
-- 3. 심사 / 사후관리 이벤트 (append-only) — 업체 인증 기준
-- ------------------------------------------------------------------------------
CREATE TABLE public.dpp_kofoti_cert_reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cert_id     TEXT NOT NULL REFERENCES public.dpp_kofoti_certifications(id) ON DELETE CASCADE,
    event       TEXT NOT NULL CHECK (event IN
                ('submitted','doc_review','fee_paid','site_audit','approved','issued',
                 'rejected','revoked','renewed','post_market_check','mark_issued','mark_revoked')),
    actor_name  TEXT NOT NULL,
    actor_org   TEXT,
    actor_role  TEXT NOT NULL DEFAULT 'cert_auditor',
    comment     TEXT,
    payload     JSONB DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dpp_kofoti_review_cert ON public.dpp_kofoti_cert_reviews(cert_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. 채번 카운터 (업체 인증번호 / 마크 발급번호)
--    RLS를 켜고 정책을 두지 않아 anon 직접 접근을 차단하고 RPC로만 접근시킨다.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dpp_kofoti_cert_counters (
    year INT PRIMARY KEY, last_seq INT NOT NULL DEFAULT 0
);
ALTER TABLE public.dpp_kofoti_cert_counters ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.dpp_kofoti_mark_counters (
    year INT PRIMARY KEY, last_seq INT NOT NULL DEFAULT 0
);
ALTER TABLE public.dpp_kofoti_mark_counters ENABLE ROW LEVEL SECURITY;

-- 업체 인증번호 채번 (20260905 에서 생성됨 — 멱등 재정의)
CREATE OR REPLACE FUNCTION public.next_kofoti_cert_seq(p_year INT)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_seq INT;
BEGIN
    INSERT INTO public.dpp_kofoti_cert_counters(year, last_seq) VALUES (p_year, 1)
    ON CONFLICT (year) DO UPDATE SET last_seq = dpp_kofoti_cert_counters.last_seq + 1
    RETURNING last_seq INTO v_seq;
    RETURN v_seq;
END $fn$;
GRANT EXECUTE ON FUNCTION public.next_kofoti_cert_seq(INT) TO anon, authenticated;

-- 마크 발급번호 채번
CREATE OR REPLACE FUNCTION public.next_kofoti_mark_seq(p_year INT)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_seq INT;
BEGIN
    INSERT INTO public.dpp_kofoti_mark_counters(year, last_seq) VALUES (p_year, 1)
    ON CONFLICT (year) DO UPDATE SET last_seq = dpp_kofoti_mark_counters.last_seq + 1
    RETURNING last_seq INTO v_seq;
    RETURN v_seq;
END $fn$;
GRANT EXECUTE ON FUNCTION public.next_kofoti_mark_seq(INT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 5. RLS (기존 데모 정책과 동일 수준 — 인증 도입 전까지 전면 개방)
-- ------------------------------------------------------------------------------
ALTER TABLE public.dpp_kofoti_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpp_kofoti_mark_issues    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpp_kofoti_cert_reviews   ENABLE ROW LEVEL SECURITY;

DO $policy$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['dpp_kofoti_certifications','dpp_kofoti_mark_issues','dpp_kofoti_cert_reviews']
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow public read %s" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Allow public read %s" ON public.%I FOR SELECT USING (true)', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow public write %s" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Allow public write %s" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
    END LOOP;
END
$policy$;
