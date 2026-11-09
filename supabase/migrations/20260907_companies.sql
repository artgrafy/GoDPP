-- ==============================================================================
-- GoDPP 업체 마스터 도입 — 소유권/권한의 기준점 만들기
--
-- 【구조】
--   dpp_companies         업체 마스터 (사업자등록번호가 자연 식별자)
--   dpp_company_members   계정 ↔ 업체 연결 (Supabase Auth 도입 시 활성화)
--   기존 DPP 테이블에 company_id FK 추가 + 이름 기준 백필
--
-- 【기존 이름 컬럼은 남긴다】
--   supplier_name / brand_name 은 삭제하지 않는다.
--   DPP는 '발급 시점의 표기'를 보존해야 하는 문서이므로 스냅샷으로서 의미가 있고,
--   company_id 가 정본(canonical)이 된다.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. 업체 마스터
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dpp_companies (
    id              TEXT PRIMARY KEY,               -- CMP-2026-8F3A21C9
    name            TEXT NOT NULL,                  -- 표시용 업체명
    biz_no          TEXT,                           -- 사업자등록번호 (표기는 하이픈 허용)
    representative  TEXT,
    address         TEXT,
    contact         TEXT,
    industry        TEXT CHECK (industry IN ('fashion','school','sports','bedding','fabric','etc')),
    roles           JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ["fabric_supplier","manufacturer"]
    note            TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_dpp_companies_biz_no
    ON public.dpp_companies ((regexp_replace(biz_no, '[^0-9]', '', 'g')))
    WHERE biz_no IS NOT NULL AND regexp_replace(biz_no, '[^0-9]', '', 'g') <> '';

CREATE INDEX IF NOT EXISTS idx_dpp_companies_name
    ON public.dpp_companies ((regexp_replace(btrim(name), '\s+', ' ', 'g')));

COMMENT ON TABLE public.dpp_companies IS
    '업체 마스터. 원단/완제품의 소유자이며 향후 계정·권한(RLS)의 기준 키.';

-- ------------------------------------------------------------------------------
-- 2. 계정 ↔ 업체 연결
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dpp_company_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  TEXT NOT NULL REFERENCES public.dpp_companies(id) ON DELETE CASCADE,
    user_id     UUID,
    email       TEXT,
    role        TEXT NOT NULL DEFAULT 'staff'
                CHECK (role IN ('owner','manager','staff')),
    status      TEXT NOT NULL DEFAULT 'invited'
                CHECK (status IN ('invited','active','disabled')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_dpp_company_members_user
    ON public.dpp_company_members(company_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_dpp_company_members_email
    ON public.dpp_company_members(company_id, lower(email)) WHERE email IS NOT NULL;

COMMENT ON TABLE public.dpp_company_members IS
    '업체 담당자 계정. Auth 도입 시 이 테이블이 RLS 판정의 근거가 된다.';

-- ------------------------------------------------------------------------------
-- 3. 기존 테이블에 소유자 FK 추가
-- ------------------------------------------------------------------------------
ALTER TABLE public.dpp_fabrics
    ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES public.dpp_companies(id) ON DELETE RESTRICT;
ALTER TABLE public.dpp_passports
    ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES public.dpp_companies(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_dpp_fabrics_company   ON public.dpp_fabrics(company_id);
CREATE INDEX IF NOT EXISTS idx_dpp_passports_company ON public.dpp_passports(company_id);

-- ------------------------------------------------------------------------------
-- 4. 백필 — 기존 이름에서 업체를 만들고 연결
-- ------------------------------------------------------------------------------
DO $backfill$
DECLARE
    r RECORD;
    v_id TEXT;
BEGIN
    FOR r IN
        WITH src AS (
            SELECT regexp_replace(btrim(supplier_name), '\s+', ' ', 'g') AS nm,
                   'fabric_supplier' AS role
            FROM public.dpp_fabrics
            WHERE btrim(coalesce(supplier_name,'')) <> ''
            UNION ALL
            SELECT regexp_replace(btrim(brand_name), '\s+', ' ', 'g'),
                   'manufacturer'
            FROM public.dpp_passports
            WHERE btrim(coalesce(brand_name,'')) <> ''
        )
        SELECT nm,
               coalesce(jsonb_agg(DISTINCT role) FILTER (WHERE role IS NOT NULL), '[]'::jsonb) AS roles
        FROM src
        GROUP BY nm
    LOOP
        SELECT c.id INTO v_id
        FROM public.dpp_companies c
        WHERE regexp_replace(btrim(c.name), '\s+', ' ', 'g') = r.nm
        LIMIT 1;

        IF v_id IS NULL THEN
            v_id := 'CMP-' || to_char(NOW(), 'YYYY') || '-' ||
                    upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
            INSERT INTO public.dpp_companies (id, name, roles, note)
            VALUES (v_id, r.nm, r.roles, '20260907 마이그레이션 자동 백필');
        END IF;

        UPDATE public.dpp_fabrics
           SET company_id = v_id
         WHERE company_id IS NULL
           AND regexp_replace(btrim(supplier_name), '\s+', ' ', 'g') = r.nm;

        UPDATE public.dpp_passports
           SET company_id = v_id
         WHERE company_id IS NULL
           AND regexp_replace(btrim(brand_name), '\s+', ' ', 'g') = r.nm;

        v_id := NULL;
    END LOOP;
END
$backfill$;

UPDATE public.dpp_companies c
   SET roles = (
        SELECT coalesce(jsonb_agg(DISTINCT x), '[]'::jsonb) FROM (
            SELECT 'fabric_supplier' AS x WHERE EXISTS (SELECT 1 FROM public.dpp_fabrics   f WHERE f.company_id = c.id)
            UNION
            SELECT 'manufacturer'         WHERE EXISTS (SELECT 1 FROM public.dpp_passports p WHERE p.company_id = c.id)
        ) t
   );

-- ------------------------------------------------------------------------------
-- 5. RLS
-- ------------------------------------------------------------------------------
ALTER TABLE public.dpp_companies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpp_company_members ENABLE ROW LEVEL SECURITY;

DO $policy$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['dpp_companies','dpp_company_members']
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow public read %s" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Allow public read %s" ON public.%I FOR SELECT USING (true)', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow public write %s" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Allow public write %s" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
    END LOOP;
END
$policy$;
