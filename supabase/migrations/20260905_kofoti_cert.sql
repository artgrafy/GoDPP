-- ==============================================================================
-- GoDPP 국산 공정 이력 (domestic_origin) 컬럼 추가
-- 대상 프로젝트: Success365 (jftsdfkohskbuunptkrh)
--
-- 기존 DPP 테이블에 공정별 국산 여부 플래그 추가
-- 하위호환: 기본값 '{}' = 전 항목 미확인(null). 절대 '국외(false)'로 해석하지 않는다.
-- ==============================================================================

ALTER TABLE public.dpp_fabrics
    ADD COLUMN IF NOT EXISTS domestic_origin JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.dpp_passports
    ADD COLUMN IF NOT EXISTS domestic_origin JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.dpp_fabrics.domestic_origin IS
    '공정별 국산 여부. {"is_domestic_yarn":true|false|null, "is_domestic_weaving":..., "is_domestic_dyeing":..., "processes":{...}, "evidence":[...]}';
COMMENT ON COLUMN public.dpp_passports.domestic_origin IS
    '공정별 국산 여부(완제품). 원단에서 상속받지 못한 값과 봉제(is_domestic_sewing)를 담는다.';
