-- ==============================================================================
-- GoDPP 디지털 제품 여권(DPP) 플랫폼 스키마 (Success365 프로젝트)
-- 대상 프로젝트: Success365 (jftsdfkohskbuunptkrh)
-- ==============================================================================

-- 1. 원단(소재) 디지털 제품 여권 (dpp_fabrics)
CREATE TABLE IF NOT EXISTS public.dpp_fabrics (
    id TEXT PRIMARY KEY,                                -- 고유 원단 ID (예: FAB-2026-ECO-0991)
    name TEXT NOT NULL,                                 -- 원단명 (예: 100% GRS 리사이클 립스탑 나일론)
    supplier_name TEXT NOT NULL,                        -- 공급업체명
    supplier_country TEXT DEFAULT 'KR',                 -- 공급 국가
    composition JSONB NOT NULL DEFAULT '[]'::jsonb,     -- 혼용률 ([{"material": "Recycled Nylon", "percentage": 100}])
    weight_gsm NUMERIC DEFAULT 0,                       -- 중량 (g/m²)
    weaving_type TEXT,                                  -- 조직/구조 (예: 3-Layer Ripstop Weave)
    certifications JSONB NOT NULL DEFAULT '[]'::jsonb,  -- 인증서 ([{"name": "GRS 4.0", "id": "CU-854921", "issuer": "Control Union", "validUntil": "2027-12-31"}])
    environmental_impact JSONB NOT NULL DEFAULT '{}'::jsonb, -- 환경 지표 (탄소 kg CO2e/kg, 물 소비량 등)
    compliance_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- 유해물질(PFAS-Free/SVHC) 시험성적서 해시 및 검증 내역
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 패션 완제품 디지털 제품 여권 (dpp_passports)
CREATE TABLE IF NOT EXISTS public.dpp_passports (
    id TEXT PRIMARY KEY,                                -- 완제품 고유 DPP ID (예: DPP-2026-JKT-0042)
    product_name TEXT NOT NULL,                         -- 의류 상품명
    brand_name TEXT NOT NULL,                           -- 패션 브랜드/제조사
    category TEXT NOT NULL,                             -- 의류 카테고리 (Outerwear, Denim, Knitwear 등)
    season TEXT,                                        -- 시즌 (2026 S/S 등)
    manufactured_country TEXT DEFAULT 'KR',             -- 완제품 제조국
    image_url TEXT,                                     -- 상품 대표 이미지
    fabric_id TEXT REFERENCES public.dpp_fabrics(id) ON DELETE SET NULL, -- 연동된 원단 고유 ID
    fabric_snapshot JSONB DEFAULT '{}'::jsonb,          -- 원단 정보 스냅샷
    materials_summary JSONB NOT NULL DEFAULT '[]'::jsonb, -- 완제품 소재 구성
    eco_scores JSONB NOT NULL DEFAULT '{}'::jsonb,      -- 에코 스코어, 총 탄소발자국, 수리용이성 지수, 재활용 등급
    care_instructions JSONB NOT NULL DEFAULT '[]'::jsonb, -- 세탁 및 의류 수명 연장 가이드
    circularity_guide JSONB NOT NULL DEFAULT '{}'::jsonb, -- 순환경제 가이드 (수리센터, 중고보상, 재활용 수거)
    supply_chain_journey JSONB NOT NULL DEFAULT '[]'::jsonb, -- 원사-방적-직조-염색-봉제 공급망 추적
    deep_compliance_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- 국가/검증기관 심층 데이터 (상세 LCA 원장, 세관/통관 증빙, RoHS/REACH 검증)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 감사 및 열람 로그 (dpp_audit_logs)
CREATE TABLE IF NOT EXISTS public.dpp_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passport_id TEXT NOT NULL,
    accessor_role TEXT NOT NULL,                        -- verifying_authority, customs, manufacturer, auditor
    accessor_name TEXT NOT NULL,
    action TEXT NOT NULL,                               -- VIEW_DEEP_DATA, EXPORT_LCA_LEDGER, VERIFY_CERTIFICATE
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화 및 전용 데모 접근 정책
ALTER TABLE public.dpp_fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpp_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpp_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow public read dpp_fabrics" ON public.dpp_fabrics;
    CREATE POLICY "Allow public read dpp_fabrics" ON public.dpp_fabrics FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Allow public write dpp_fabrics" ON public.dpp_fabrics;
    CREATE POLICY "Allow public write dpp_fabrics" ON public.dpp_fabrics FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read dpp_passports" ON public.dpp_passports;
    CREATE POLICY "Allow public read dpp_passports" ON public.dpp_passports FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Allow public write dpp_passports" ON public.dpp_passports;
    CREATE POLICY "Allow public write dpp_passports" ON public.dpp_passports FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read dpp_audit_logs" ON public.dpp_audit_logs;
    CREATE POLICY "Allow public read dpp_audit_logs" ON public.dpp_audit_logs FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Allow public write dpp_audit_logs" ON public.dpp_audit_logs;
    CREATE POLICY "Allow public write dpp_audit_logs" ON public.dpp_audit_logs FOR ALL USING (true) WITH CHECK (true);
END $$;
