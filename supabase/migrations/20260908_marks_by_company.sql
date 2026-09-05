-- ==============================================================================
-- 정정: 인증마크는 제품이 아니라 '업체'에 발행된다
--
-- 【정정 근거 — 섬산련 운영현황 보고(2026.2.12)】
--   · "제조기업이 … 이를 인정하는 국산 섬유제품 인증서·확인서 및 마크를 발행"
--       → 마크가 인증서·확인서와 같은 층위에서 '기업에게' 발행된다
--   · "(마크발급) 인증기관의 발급번호 부여 후, 지정 인쇄소에서 발급"
--   · "발급현황(천매/년): 2,547('22) → 884('23) → 565('24) → 1,930('25)"
--       → 발급 단위가 '매수'. 라벨을 대량 인쇄해 업체에 공급하는 구조
--   · "진행절차: … → 계약체결 → 마크발급 신청"
--       → 업체 계약 뒤 한 단계. 제품마다 반복하는 절차가 아니다
--   · "인증마크 종류 확대(QR코드·띠지)" (2024.10.17 개정)
--       → '마크 종류'는 트랙(T1/T2/T3) × 전달 형태(지류/띠지/QR)
--
-- 【무엇이 틀렸나】
--   20260906 에서 dpp_kofoti_mark_issues 에 subject_type/subject_id(제품)를 두어
--   '제품별 마크 발급'을 만들었다. 원본에 그런 연결은 없다.
--   업체가 트랙별로 마크를 매수 단위로 발급받아 자사 제품에 부착하는 것이 실제 구조다.
--
-- 【주의】 마크 테이블을 재생성한다. 기존 3행은 데모 시드이므로 폐기 후 재투입한다.
--          dpp_kofoti_certifications / dpp_companies / DPP 테이블은 건드리지 않는다.
-- ==============================================================================

DROP TABLE IF EXISTS public.dpp_kofoti_mark_issues CASCADE;

CREATE TABLE public.dpp_kofoti_mark_issues (
    id              TEXT PRIMARY KEY,                       -- MRK-2026-3A9C21E8
    mark_no         TEXT UNIQUE,                            -- 인증기관 발급번호 (KTM-2026-00001)
    -- 발행 대상: 업체(의 인증). 제품과는 연결되지 않는다.
    cert_id         TEXT NOT NULL REFERENCES public.dpp_kofoti_certifications(id) ON DELETE CASCADE,

    track           TEXT NOT NULL CHECK (track IN ('T1','T2','T3')),
    -- 마크 전달 형태 (2024.10.17 개정으로 QR코드·띠지가 추가됨)
    carrier         TEXT NOT NULL DEFAULT 'hangtag'
                    CHECK (carrier IN ('hangtag','band','qr')),
    quantity        INTEGER NOT NULL DEFAULT 0,             -- 발급 매수
    printer         TEXT,                                   -- 지정 인쇄소

    status          TEXT NOT NULL DEFAULT 'issued'
                    CHECK (status IN ('requested','issued','revoked')),
    revoke_reason   TEXT,
    issued_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 한 업체가 같은 트랙을 여러 차례(배치별로) 발급받을 수 있으므로 (cert_id, track) 은 유일하지 않다.
CREATE INDEX idx_dpp_kofoti_mark_cert    ON public.dpp_kofoti_mark_issues(cert_id);
CREATE INDEX idx_dpp_kofoti_mark_created ON public.dpp_kofoti_mark_issues(created_at DESC);

COMMENT ON TABLE public.dpp_kofoti_mark_issues IS
    '마크 발급 — 인증기업이 계약 체결 후 트랙별로 발급번호를 부여받아 매수 단위로 공급받는다. 제품과 직접 연결되지 않는다.';
COMMENT ON COLUMN public.dpp_kofoti_mark_issues.carrier IS
    '마크 전달 형태: hangtag(지류 행택) / band(띠지) / qr(QR코드). 2024.10.17 운영규정 개정으로 확대.';

ALTER TABLE public.dpp_kofoti_mark_issues ENABLE ROW LEVEL SECURITY;

DO $policy$
BEGIN
    DROP POLICY IF EXISTS "Allow public read dpp_kofoti_mark_issues" ON public.dpp_kofoti_mark_issues;
    CREATE POLICY "Allow public read dpp_kofoti_mark_issues"
        ON public.dpp_kofoti_mark_issues FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Allow public write dpp_kofoti_mark_issues" ON public.dpp_kofoti_mark_issues;
    CREATE POLICY "Allow public write dpp_kofoti_mark_issues"
        ON public.dpp_kofoti_mark_issues FOR ALL USING (true) WITH CHECK (true);
END
$policy$;
