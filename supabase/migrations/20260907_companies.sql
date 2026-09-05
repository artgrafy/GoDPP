-- ==============================================================================
-- GoDPP 업체 마스터 도입 — 소유권/권한의 기준점 만들기
--
-- 【배경】
--   지금까지 '업체'는 서로 무관한 자유 텍스트 3개로 흩어져 있었다:
--     dpp_fabrics.supplier_name / dpp_passports.brand_name
--     dpp_kofoti_certifications.company_name
--   UNIQUE·FK가 없어 같은 업체를 여러 번 등록해도 막히지 않고,
--   "업체로 조회"가 문자열 완전일치에 의존해 공백 하나로 깨진다(실제로 2건 발생).
--
--   향후 계정·권한(업체 담당자만 자사 데이터 입력)을 붙이려면 RLS가 참조할
--   **소유자 키**가 필요하다. 이름 문자열은 그 역할을 할 수 없다.
--
-- 【구조】
--   dpp_companies         업체 마스터 (사업자등록번호가 자연 식별자)
--   dpp_company_members   계정 ↔ 업체 연결 (Supabase Auth 도입 시 활성화)
--   기존 3개 테이블에 company_id FK 추가 + 이름 기준 백필
--
-- 【기존 이름 컬럼은 남긴다】
--   supplier_name / brand_name / company_name 은 삭제하지 않는다.
--   DPP·인증서는 '발급 시점의 표기'를 보존해야 하는 문서이므로 스냅샷으로서 의미가 있고,
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
    -- 계약업체 업종 분류 (패션/학생복/운동복/침구류/직물류/기타)
    industry        TEXT CHECK (industry IN ('fashion','school','sports','bedding','fabric','etc')),
    -- 이 업체가 플랫폼에서 수행하는 역할. 한 업체가 복수 역할을 가질 수 있다.
    roles           JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ["fabric_supplier","manufacturer"]
    note            TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 사업자등록번호는 표기(하이픈/공백)가 제각각이므로 숫자만 뽑아 유일성을 보장한다.
-- 번호가 없는 업체(NULL)는 제약 대상에서 제외된다.
CREATE UNIQUE INDEX IF NOT EXISTS uq_dpp_companies_biz_no
    ON public.dpp_companies ((regexp_replace(biz_no, '[^0-9]', '', 'g')))
    WHERE biz_no IS NOT NULL AND regexp_replace(biz_no, '[^0-9]', '', 'g') <> '';

-- 이름은 공백 표기가 흔들리므로 정규화 기준으로 조회한다.
-- (동명이인 업체가 실제로 존재할 수 있어 UNIQUE 로 막지는 않는다)
CREATE INDEX IF NOT EXISTS idx_dpp_companies_name
    ON public.dpp_companies ((regexp_replace(btrim(name), '\s+', ' ', 'g')));

COMMENT ON TABLE public.dpp_companies IS
    '업체 마스터. 원단/완제품/국산인증의 소유자이며 향후 계정·권한(RLS)의 기준 키.';
COMMENT ON COLUMN public.dpp_companies.biz_no IS
    '사업자등록번호. 숫자만 추출한 값에 UNIQUE 인덱스가 걸려 있어 표기가 달라도 중복 등록되지 않는다.';

-- ------------------------------------------------------------------------------
-- 2. 계정 ↔ 업체 연결
--    Supabase Auth 도입 전이므로 user_id 에 FK를 걸지 않는다(auth.users 참조는 도입 시 추가).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dpp_company_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  TEXT NOT NULL REFERENCES public.dpp_companies(id) ON DELETE CASCADE,
    user_id     UUID,                               -- auth.users.id (가입 완료 시 채워진다)
    email       TEXT,                               -- 초대 시점 식별자
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
--    ON DELETE RESTRICT: 제품/인증이 달린 업체는 실수로 지워지지 않게 막는다.
-- ------------------------------------------------------------------------------
ALTER TABLE public.dpp_fabrics
    ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES public.dpp_companies(id) ON DELETE RESTRICT;
ALTER TABLE public.dpp_passports
    ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES public.dpp_companies(id) ON DELETE RESTRICT;
ALTER TABLE public.dpp_kofoti_certifications
    ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES public.dpp_companies(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_dpp_fabrics_company   ON public.dpp_fabrics(company_id);
CREATE INDEX IF NOT EXISTS idx_dpp_passports_company ON public.dpp_passports(company_id);
CREATE INDEX IF NOT EXISTS idx_dpp_kofoti_cert_company_id
    ON public.dpp_kofoti_certifications(company_id);

-- 한 업체는 국산인증을 1건만 보유한다(계약 갱신은 previous_cert_id 로 이어지는 새 행).
-- 취소·반려된 과거 이력은 제외하고, 살아 있는 인증만 유일하게 유지한다.
CREATE UNIQUE INDEX IF NOT EXISTS uq_dpp_kofoti_cert_active_company
    ON public.dpp_kofoti_certifications(company_id)
    WHERE company_id IS NOT NULL AND status IN ('submitted','under_review','approved','issued');

-- ------------------------------------------------------------------------------
-- 4. 백필 — 기존 이름에서 업체를 만들고 연결
-- ------------------------------------------------------------------------------
DO $backfill$
DECLARE
    r RECORD;
    v_id TEXT;
BEGIN
    -- 4-1. 이름을 정규화(앞뒤 공백 제거 + 연속 공백 1칸)해 고유 업체를 뽑는다.
    --      사업자등록번호가 있는 인증 테이블을 우선 채택한다.
    FOR r IN
        WITH src AS (
            SELECT regexp_replace(btrim(company_name), '\s+', ' ', 'g') AS nm,
                   biz_no, industry, representative, address, contact, 1 AS pri,
                   NULL::text AS role
            FROM public.dpp_kofoti_certifications
            WHERE btrim(coalesce(company_name,'')) <> ''
            UNION ALL
            SELECT regexp_replace(btrim(supplier_name), '\s+', ' ', 'g'),
                   NULL, NULL, NULL, NULL, NULL, 2, 'fabric_supplier'
            FROM public.dpp_fabrics
            WHERE btrim(coalesce(supplier_name,'')) <> ''
            UNION ALL
            SELECT regexp_replace(btrim(brand_name), '\s+', ' ', 'g'),
                   NULL, NULL, NULL, NULL, NULL, 3, 'manufacturer'
            FROM public.dpp_passports
            WHERE btrim(coalesce(brand_name,'')) <> ''
        )
        SELECT nm,
               (array_agg(biz_no         ORDER BY pri) FILTER (WHERE biz_no IS NOT NULL))[1]         AS biz_no,
               (array_agg(industry       ORDER BY pri) FILTER (WHERE industry IS NOT NULL))[1]       AS industry,
               (array_agg(representative ORDER BY pri) FILTER (WHERE representative IS NOT NULL))[1] AS representative,
               (array_agg(address        ORDER BY pri) FILTER (WHERE address IS NOT NULL))[1]        AS address,
               (array_agg(contact        ORDER BY pri) FILTER (WHERE contact IS NOT NULL))[1]        AS contact,
               coalesce(jsonb_agg(DISTINCT role) FILTER (WHERE role IS NOT NULL), '[]'::jsonb)       AS roles
        FROM src
        GROUP BY nm
    LOOP
        -- 이미 같은 사업자등록번호 또는 같은 정규화 이름이 있으면 재사용한다.
        SELECT c.id INTO v_id
        FROM public.dpp_companies c
        WHERE (r.biz_no IS NOT NULL
               AND regexp_replace(c.biz_no, '[^0-9]', '', 'g') = regexp_replace(r.biz_no, '[^0-9]', '', 'g'))
           OR regexp_replace(btrim(c.name), '\s+', ' ', 'g') = r.nm
        LIMIT 1;

        IF v_id IS NULL THEN
            v_id := 'CMP-' || to_char(NOW(), 'YYYY') || '-' ||
                    upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
            INSERT INTO public.dpp_companies
                (id, name, biz_no, representative, address, contact, industry, roles, note)
            VALUES (v_id, r.nm, r.biz_no, r.representative, r.address, r.contact, r.industry, r.roles,
                    '20260907 마이그레이션 자동 백필');
        END IF;

        -- 4-2. 정규화 이름이 같은 기존 행을 이 업체로 연결한다.
        UPDATE public.dpp_kofoti_certifications
           SET company_id = v_id
         WHERE company_id IS NULL
           AND regexp_replace(btrim(company_name), '\s+', ' ', 'g') = r.nm;

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

-- 4-3. 백필 결과에 맞춰 역할을 보정한다(원단도 만들고 완제품도 만드는 업체 대응).
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
--    지금은 계정이 없어 기존 데모 정책과 동일하게 전면 개방한다.
--    Auth 도입 시 아래 주석의 정책으로 교체하면 소유권 기반 접근제어가 즉시 성립한다.
--
--    예) 자사 원단만 수정:
--      CREATE POLICY "own fabrics" ON public.dpp_fabrics FOR ALL
--        USING (company_id IN (
--          SELECT company_id FROM public.dpp_company_members
--           WHERE user_id = auth.uid() AND status = 'active'));
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
