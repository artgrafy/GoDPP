-- ==============================================================================
-- GoDPP 「국산 섬유제품 인증제도」(섬산련 KOFOTI) 관리 스키마
-- 대상 프로젝트: Success365 (jftsdfkohskbuunptkrh)
--
-- 제도 근거: 한국섬유산업연합회 국산 섬유제품 인증제도 운영규정 (2024.10.17 개정)
--  - 밸류체인 5단계: 원사 → 제직·편직 → 염색·가공 → 봉제 → 패션제품
--  - 트랙 T1(KOREA PRODUCT) / T2(KOREA TEXTILE) / T3(KOREA PRODUCT PLUS, Yarn Forward)
--  - 투트랙 검증: 제3자 인증(현장실사→인증서) / 기업자율인증(자기적합성선언→확인서)
--  - 계약기간 2년
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. 기존 DPP 테이블에 공정별 국산 여부 플래그 추가
--    하위호환: 기본값 '{}' = 전 항목 미확인(null). 절대 '국외(false)'로 해석하지 않는다.
-- ------------------------------------------------------------------------------
ALTER TABLE public.dpp_fabrics
    ADD COLUMN IF NOT EXISTS domestic_origin JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.dpp_passports
    ADD COLUMN IF NOT EXISTS domestic_origin JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.dpp_fabrics.domestic_origin IS
    '공정별 국산 여부. {"is_domestic_yarn":true|false|null, "is_domestic_weaving":..., "is_domestic_dyeing":..., "processes":{...}, "evidence":[...]}';
COMMENT ON COLUMN public.dpp_passports.domestic_origin IS
    '공정별 국산 여부(완제품). 원단에서 상속받지 못한 값과 봉제(is_domestic_sewing)를 담는다.';

-- ------------------------------------------------------------------------------
-- 2. 인증 신청 ~ 발급 단일 상태머신 (dpp_kofoti_certifications)
--    신청 1건 ↔ 발급 문서 1건이 엄격한 1:1이므로 테이블을 분리하지 않는다.
--    재계약은 행 변경이 아니라 previous_cert_id로 연결된 새 행으로 모델링한다.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dpp_kofoti_certifications (
    id                  TEXT PRIMARY KEY,                   -- 신청 ID (예: APP-2026-8F3A21C9)
    cert_no             TEXT UNIQUE,                        -- 인증번호. 발급 후에만 부여 (예: K-TEX-2026-0001)
    subject_type        TEXT NOT NULL CHECK (subject_type IN ('fabric','passport')),
    subject_id          TEXT NOT NULL,                      -- FAB-... 또는 DPP-... (대상 테이블이 2개라 FK 없음)
    subject_name        TEXT,                               -- 발급 시점 제품/원단명 동결
    applicant_company   TEXT NOT NULL,                      -- 신청기업명
    applicant_biz_no    TEXT,                               -- 사업자등록번호
    applicant_contact   TEXT,                               -- 담당자 연락처
    scheme              TEXT NOT NULL CHECK (scheme IN ('third_party','self_declaration')),
    requested_track     TEXT CHECK (requested_track IN ('T1','T2','T3')),
    decided_track       TEXT CHECK (decided_track  IN ('T1','T2','T3')),
    status              TEXT NOT NULL DEFAULT 'submitted'
                        CHECK (status IN ('draft','submitted','under_review','approved','issued','rejected','revoked')),
    domestic_snapshot   JSONB NOT NULL DEFAULT '{}'::jsonb, -- 신청 시점 공정 플래그 동결(DomesticOrigin)
    evaluation          JSONB NOT NULL DEFAULT '{}'::jsonb, -- 판정엔진 결과 동결(TrackVerdict)
    quality_declaration JSONB NOT NULL DEFAULT '{}'::jsonb, -- 전안법 제23조/제46조 자기적합성선언
    review_checklist    JSONB NOT NULL DEFAULT '{}'::jsonb, -- 절차 체크(서류심사/수수료/현장심사/적격성/계약)
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

CREATE INDEX IF NOT EXISTS idx_dpp_kofoti_cert_status  ON public.dpp_kofoti_certifications(status);
CREATE INDEX IF NOT EXISTS idx_dpp_kofoti_cert_subject ON public.dpp_kofoti_certifications(subject_id);
CREATE INDEX IF NOT EXISTS idx_dpp_kofoti_cert_created ON public.dpp_kofoti_certifications(created_at DESC);

COMMENT ON TABLE public.dpp_kofoti_certifications IS
    '국산 섬유제품 인증 신청~발급 상태머신. status: draft→submitted→under_review→approved→issued (또는 rejected/revoked)';
COMMENT ON COLUMN public.dpp_kofoti_certifications.scheme IS
    'third_party=제3자 인증(현장실사→인증서), self_declaration=기업자율인증(자기적합성선언→확인서)';

-- ------------------------------------------------------------------------------
-- 3. 심사 / 사후관리 이벤트 (append-only)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dpp_kofoti_cert_reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cert_id     TEXT NOT NULL REFERENCES public.dpp_kofoti_certifications(id) ON DELETE CASCADE,
    event       TEXT NOT NULL CHECK (event IN
                ('submitted','doc_review','fee_paid','site_audit','approved','issued',
                 'rejected','revoked','renewed','post_market_check')),
    actor_name  TEXT NOT NULL,
    actor_org   TEXT,
    actor_role  TEXT NOT NULL DEFAULT 'cert_auditor',
    comment     TEXT,
    payload     JSONB DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dpp_kofoti_review_cert ON public.dpp_kofoti_cert_reviews(cert_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. 인증번호 채번 카운터
--    RLS를 켜고 정책을 만들지 않아 anon 직접 접근을 차단한다.
--    (카운터를 조작하면 인증번호 체계 전체가 무너지므로 RPC로만 접근시킨다)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dpp_kofoti_cert_counters (
    year     INT PRIMARY KEY,
    last_seq INT NOT NULL DEFAULT 0
);

ALTER TABLE public.dpp_kofoti_cert_counters ENABLE ROW LEVEL SECURITY;

-- INSERT ... ON CONFLICT DO UPDATE ... RETURNING 은 단일 문장이라 행 잠금으로 동시성이 보장된다.
CREATE OR REPLACE FUNCTION public.next_kofoti_cert_seq(p_year INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_seq INT;
BEGIN
    INSERT INTO public.dpp_kofoti_cert_counters(year, last_seq)
    VALUES (p_year, 1)
    ON CONFLICT (year) DO UPDATE SET last_seq = dpp_kofoti_cert_counters.last_seq + 1
    RETURNING last_seq INTO v_seq;
    RETURN v_seq;
END
$fn$;

GRANT EXECUTE ON FUNCTION public.next_kofoti_cert_seq(INT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 5. RLS (기존 데모 정책과 동일 수준 — 인증 도입 전까지 전면 개방)
-- ------------------------------------------------------------------------------
ALTER TABLE public.dpp_kofoti_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpp_kofoti_cert_reviews   ENABLE ROW LEVEL SECURITY;

DO $policy$
BEGIN
    DROP POLICY IF EXISTS "Allow public read dpp_kofoti_certifications" ON public.dpp_kofoti_certifications;
    CREATE POLICY "Allow public read dpp_kofoti_certifications"
        ON public.dpp_kofoti_certifications FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Allow public write dpp_kofoti_certifications" ON public.dpp_kofoti_certifications;
    CREATE POLICY "Allow public write dpp_kofoti_certifications"
        ON public.dpp_kofoti_certifications FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read dpp_kofoti_cert_reviews" ON public.dpp_kofoti_cert_reviews;
    CREATE POLICY "Allow public read dpp_kofoti_cert_reviews"
        ON public.dpp_kofoti_cert_reviews FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Allow public write dpp_kofoti_cert_reviews" ON public.dpp_kofoti_cert_reviews;
    CREATE POLICY "Allow public write dpp_kofoti_cert_reviews"
        ON public.dpp_kofoti_cert_reviews FOR ALL USING (true) WITH CHECK (true);
END
$policy$;
