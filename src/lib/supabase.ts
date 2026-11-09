import { createClient } from '@supabase/supabase-js';
import { FabricDPP, FashionDPP, AuditLog } from '@/types/dpp';
import type {
  Company,
  CompanyMember
} from '@/types/domesticCert';
import { normalizeBizNo, normalizeCompanyName } from '@/types/domesticCert';
import { SEED_FABRICS, SEED_PASSPORTS, SEED_COMPANIES } from './seedData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jftsdfkohskbuunptkrh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// 로컬스토리지 키
const STORAGE_KEY_FABRICS = 'godpp_fabrics_v3';
const STORAGE_KEY_PASSPORTS = 'godpp_passports_v3';
const STORAGE_KEY_LOGS = 'godpp_audit_logs_v3';
const STORAGE_KEY_COMPANIES = 'godpp_companies_v1';

// 이미지 URL 자동 보정 맵 (부적절/깨진 이미지 -> 고화질 매칭 이미지)
const BROKEN_IMAGE_FALLBACKS: Record<string, string> = {
  'https://images.unsplash.com/photo-1542272604-780c96856592': 'https://images.unsplash.com/photo-1631112213238-b1bafeaecff3?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1544441893-675973e31985': 'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=1000&q=80',
};

// 브라우저 로컬 스토리지 초기화 / 가져오기
function getLocalData<T>(key: string, defaultData: T): T {
  if (typeof window === 'undefined') return defaultData;
  try {
    let raw = localStorage.getItem(key);
    
    // v1, v2 데이터 마이그레이션 지원
    if (!raw && key.includes('_v3')) {
      raw = localStorage.getItem(key.replace('_v3', '_v2')) || localStorage.getItem(key.replace('_v3', '_v1'));
    }

    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }

    let parsed = JSON.parse(raw);
    
    // 이전 캐시에 깨진 이미지 URL이 있는 경우 자동 교정
    if (Array.isArray(parsed)) {
      parsed = parsed.map((item: any) => {
        if (item && item.image_url) {
          for (const [broken, fixed] of Object.entries(BROKEN_IMAGE_FALLBACKS)) {
            if (item.image_url.includes(broken)) {
              return { ...item, image_url: fixed };
            }
          }
        }
        return item;
      });
      localStorage.setItem(key, JSON.stringify(parsed));
    }

    return parsed;
  } catch (err) {
    console.warn(`[GoDPP] LocalStorage read failed for ${key}:`, err);
    return defaultData;
  }
}

/**
 * 마이그레이션 미적용 DB는 domestic_origin 컬럼 자체가 없어 원격 행에 그 필드가 undefined로 온다.
 * 그대로 두면 사용자가 방금 입력한 국산 공정 이력이 목록 새로고침 때마다 사라진다.
 *
 * 컬럼이 '없을 때'(undefined)만 로컬 값을 이어붙인다.
 * 컬럼이 있고 값이 비어 있으면({}) 그것은 원격의 정당한 상태이므로 건드리지 않는다.
 */
function carryOverDomesticOrigin<T extends { id: string; domestic_origin?: any }>(
  remote: T[],
  local: T[]
): T[] {
  if (remote.length === 0 || remote[0].domestic_origin !== undefined) return remote;
  const localById = new Map(local.map((item) => [item.id, item]));
  return remote.map((row) => {
    const origin = localById.get(row.id)?.domestic_origin;
    return origin ? { ...row, domestic_origin: origin } : row;
  });
}

function setLocalData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[GoDPP] LocalStorage write failed for ${key}:`, err);
  }
}

// ==============================================================================
// 원단(Fabric) 데이터 계층
// ==============================================================================

export async function getFabrics(): Promise<FabricDPP[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('dpp_fabrics')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const local = getLocalData<FabricDPP[]>(STORAGE_KEY_FABRICS, SEED_FABRICS);
        const merged = carryOverDomesticOrigin(data as FabricDPP[], local);
        // 성공 시 로컬에도 동기화
        setLocalData(STORAGE_KEY_FABRICS, merged);
        return merged;
      }
    } catch (err) {
      console.warn('[GoDPP] Supabase getFabrics fallback to local:', err);
    }
  }

  return getLocalData<FabricDPP[]>(STORAGE_KEY_FABRICS, SEED_FABRICS);
}

export async function getFabricById(id: string): Promise<FabricDPP | null> {
  const cleanId = (id || '').trim();
  if (!cleanId) return null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('dpp_fabrics')
        .select('*')
        .eq('id', cleanId)
        .single();

      if (!error && data) {
        const local = getLocalData<FabricDPP[]>(STORAGE_KEY_FABRICS, SEED_FABRICS);
        return carryOverDomesticOrigin([data as FabricDPP], local)[0];
      }
    } catch (err) {
      console.warn(`[GoDPP] Supabase getFabricById(${cleanId}) fallback:`, err);
    }
  }

  const list = getLocalData<FabricDPP[]>(STORAGE_KEY_FABRICS, SEED_FABRICS);
  return list.find((f) => f.id.trim() === cleanId) || null;
}

export async function saveFabric(fabric: FabricDPP): Promise<{ success: boolean; data?: FabricDPP; error?: string }> {
  // 1. 로컬 저장소 우선 업데이트
  const currentList = getLocalData<FabricDPP[]>(STORAGE_KEY_FABRICS, SEED_FABRICS);
  const existingIdx = currentList.findIndex((f) => f.id === fabric.id);
  let updatedList: FabricDPP[];

  if (existingIdx >= 0) {
    updatedList = [...currentList];
    updatedList[existingIdx] = { ...fabric, updated_at: new Date().toISOString() };
  } else {
    updatedList = [{ ...fabric, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...currentList];
  }
  setLocalData(STORAGE_KEY_FABRICS, updatedList);

  // 2. Supabase가 연결되어 있다면 클라우드 DB에 동기화
  if (supabase) {
    const base = {
      id: fabric.id,
      name: fabric.name,
      supplier_name: fabric.supplier_name,
      supplier_country: fabric.supplier_country,
      composition: fabric.composition,
      weight_gsm: fabric.weight_gsm,
      weaving_type: fabric.weaving_type,
      certifications: fabric.certifications,
      environmental_impact: fabric.environmental_impact,
      compliance_data: fabric.compliance_data,
      company_id: fabric.company_id ?? null,
      updated_at: new Date().toISOString()
    };

    try {
      let { data, error } = await supabase
        .from('dpp_fabrics')
        .upsert({ ...base, domestic_origin: fabric.domestic_origin ?? {} })
        .select()
        .single();

      // 마이그레이션 미적용 DB에서는 domestic_origin 없이 한 번 더 시도한다.
      if (isMissingDomesticOriginColumn(error)) {
        console.warn(
          '[GoDPP] dpp_fabrics.domestic_origin 컬럼이 없습니다. 20260905_kofoti_cert.sql 마이그레이션을 적용하세요. 국산 공정 이력을 제외하고 저장합니다.'
        );
        ({ data, error } = await supabase.from('dpp_fabrics').upsert(base).select().single());
      }

      if (error) {
        console.warn('[GoDPP] Supabase saveFabric warning:', error.message);
      } else if (data) {
        // 원격에 domestic_origin이 없더라도 로컬 값은 유지해서 화면 표시가 후퇴하지 않게 한다.
        return { success: true, data: { ...(data as FabricDPP), domestic_origin: fabric.domestic_origin } };
      }
    } catch (err: any) {
      console.warn('[GoDPP] Supabase saveFabric error:', err?.message || err);
    }
  }

  return { success: true, data: fabric };
}

// ==============================================================================
// 패션 완제품(Passport) 데이터 계층
// ==============================================================================

export async function getPassports(): Promise<FashionDPP[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('dpp_passports')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const local = getLocalData<FashionDPP[]>(STORAGE_KEY_PASSPORTS, SEED_PASSPORTS);
        const merged = carryOverDomesticOrigin(data as FashionDPP[], local);
        setLocalData(STORAGE_KEY_PASSPORTS, merged);
        return merged;
      }
    } catch (err) {
      console.warn('[GoDPP] Supabase getPassports fallback:', err);
    }
  }

  return getLocalData<FashionDPP[]>(STORAGE_KEY_PASSPORTS, SEED_PASSPORTS);
}

export async function getPassportById(id: string): Promise<FashionDPP | null> {
  const cleanId = (id || '').trim();
  if (!cleanId) return null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('dpp_passports')
        .select('*')
        .eq('id', cleanId)
        .single();

      if (!error && data) {
        const local = getLocalData<FashionDPP[]>(STORAGE_KEY_PASSPORTS, SEED_PASSPORTS);
        return carryOverDomesticOrigin([data as FashionDPP], local)[0];
      }
    } catch (err) {
      console.warn(`[GoDPP] Supabase getPassportById(${cleanId}) fallback:`, err);
    }
  }

  const list = getLocalData<FashionDPP[]>(STORAGE_KEY_PASSPORTS, SEED_PASSPORTS);
  return list.find((p) => p.id.trim() === cleanId) || null;
}

export async function savePassport(passport: FashionDPP): Promise<{ success: boolean; data?: FashionDPP; error?: string }> {
  // 1. 로컬 저장소 우선 업데이트
  const currentList = getLocalData<FashionDPP[]>(STORAGE_KEY_PASSPORTS, SEED_PASSPORTS);
  const existingIdx = currentList.findIndex((p) => p.id === passport.id);
  let updatedList: FashionDPP[];

  if (existingIdx >= 0) {
    updatedList = [...currentList];
    updatedList[existingIdx] = { ...passport, updated_at: new Date().toISOString() };
  } else {
    updatedList = [{ ...passport, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...currentList];
  }
  setLocalData(STORAGE_KEY_PASSPORTS, updatedList);

  // 2. Supabase가 연결되어 있다면 클라우드 DB에 동기화
  if (supabase) {
    const base = {
      id: passport.id,
      product_name: passport.product_name,
      brand_name: passport.brand_name,
      category: passport.category,
      season: passport.season,
      manufactured_country: passport.manufactured_country,
      image_url: passport.image_url,
      fabric_id: passport.fabric_id,
      fabric_snapshot: passport.fabric_snapshot,
      materials_summary: passport.materials_summary,
      eco_scores: passport.eco_scores,
      care_instructions: passport.care_instructions,
      circularity_guide: passport.circularity_guide,
      supply_chain_journey: passport.supply_chain_journey,
      deep_compliance_data: passport.deep_compliance_data,
      company_id: passport.company_id ?? null,
      updated_at: new Date().toISOString()
    };

    try {
      let { data, error } = await supabase
        .from('dpp_passports')
        .upsert({ ...base, domestic_origin: passport.domestic_origin ?? {} })
        .select()
        .single();

      // 마이그레이션 미적용 DB에서는 domestic_origin 없이 한 번 더 시도한다.
      if (isMissingDomesticOriginColumn(error)) {
        console.warn(
          '[GoDPP] dpp_passports.domestic_origin 컬럼이 없습니다. 20260905_kofoti_cert.sql 마이그레이션을 적용하세요. 국산 공정 이력을 제외하고 저장합니다.'
        );
        ({ data, error } = await supabase.from('dpp_passports').upsert(base).select().single());
      }

      if (error) {
        console.warn('[GoDPP] Supabase savePassport warning:', error.message);
      } else if (data) {
        return {
          success: true,
          data: { ...(data as FashionDPP), domestic_origin: passport.domestic_origin }
        };
      }
    } catch (err: any) {
      console.warn('[GoDPP] Supabase savePassport error:', err?.message || err);
    }
  }

  return { success: true, data: passport };
}

// ==============================================================================
// 감사 로그 (Audit Logs)
// ==============================================================================

export async function logAuditAction(action: {
  passport_id: string;
  accessor_role: string;
  accessor_name: string;
  action: string;
  details?: Record<string, any>;
}): Promise<void> {
  const currentLogs = getLocalData<AuditLog[]>(STORAGE_KEY_LOGS, []);
  const newLog: AuditLog = {
    id: `log-${Date.now()}`,
    ...action,
    created_at: new Date().toISOString()
  };
  setLocalData(STORAGE_KEY_LOGS, [newLog, ...currentLogs.slice(0, 99)]);

  if (supabase) {
    try {
      await supabase.from('dpp_audit_logs').insert([action]);
    } catch (err) {
      console.warn('[GoDPP] Audit log supabase write failed:', err);
    }
  }
}

export function getAuditLogs(): AuditLog[] {
  return getLocalData<AuditLog[]>(STORAGE_KEY_LOGS, []);
}

/**
 * domestic_origin 컬럼이 아직 적용되지 않은 DB에서 발생하는 오류인지 판정한다.
 * (PostgREST는 없는 컬럼에 대해 42703 / PGRST204 를 돌려준다)
 */
function isMissingDomesticOriginColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message || '';
  return (
    (error.code === '42703' || error.code === 'PGRST204' || /column/i.test(msg)) &&
    msg.includes('domestic_origin')
  );
}

// ==============================================================================
// 업체 마스터 (dpp_companies / dpp_company_members)
//
// 원단·완제품의 소유자이며, 향후 계정·권한(RLS)이 참조할 기준 키다.
// 이름 문자열이 아니라 company_id 로 묶는 것이 요점 — 이름은 공백 하나에 깨진다.
// ==============================================================================

/**
 * 업체는 id 가 아니라 '같은 회사인가'로 병합해야 한다.
 *
 * 로컬 시드(CMP-2026-DEMO000X)와 클라우드 백필(CMP-2026-랜덤)은 같은 회사인데 id 가 다르다.
 * id 기준으로만 병합하면 같은 회사가 둘로 보이고, 로컬 id 로 저장하려다
 * 사업자번호 UNIQUE 위반 → 그 id 로 제품을 저장하면 FK 위반으로 이어진다.
 *
 * 따라서 원격이 존재하면 원격을 정본으로 삼고, 사업자번호·정규화 이름이 겹치는
 * 로컬 항목은 버린다. 로컬 시드는 클라우드가 비었을 때의 폴백일 뿐이다.
 */
function mergeCompanies(remote: Company[], local: Company[]): Company[] {
  if (remote.length === 0) return local;
  const remoteIds = new Set(remote.map((c) => c.id));
  const remoteBiz = new Set(
    remote.map((c) => normalizeBizNo(c.biz_no)).filter((x) => x.length > 0)
  );
  const remoteNames = new Set(remote.map((c) => normalizeCompanyName(c.name)));

  const keptLocal = local.filter((c) => {
    if (remoteIds.has(c.id)) return false;
    const biz = normalizeBizNo(c.biz_no);
    if (biz && remoteBiz.has(biz)) return false;
    if (remoteNames.has(normalizeCompanyName(c.name))) return false;
    return true;
  });
  return [...remote, ...keptLocal];
}

export async function getCompanies(): Promise<Company[]> {
  const local = getLocalData<Company[]>(STORAGE_KEY_COMPANIES, SEED_COMPANIES);
  let merged = local;

  if (supabase) {
    try {
      const { data, error } = await supabase.from('dpp_companies').select('*');
      if (!error && data) {
        merged = mergeCompanies(data as Company[], local);
        setLocalData(STORAGE_KEY_COMPANIES, merged);
      }
    } catch (err) {
      console.warn('[GoDPP] Supabase getCompanies fallback:', err);
    }
  }
  return [...merged].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const clean = (id || '').trim();
  if (!clean) return null;
  return (await getCompanies()).find((c) => c.id === clean) || null;
}

/**
 * 이름·사업자등록번호로 기존 업체를 찾는다.
 * DB의 UNIQUE 인덱스와 같은 정규화 규칙(숫자만/공백 축약)을 쓴다.
 */
export async function findCompany(opts: {
  bizNo?: string | null;
  name?: string | null;
}): Promise<Company | null> {
  const list = await getCompanies();
  const biz = normalizeBizNo(opts.bizNo);
  if (biz) {
    const hit = list.find((c) => normalizeBizNo(c.biz_no) === biz);
    if (hit) return hit;
  }
  const nm = normalizeCompanyName(opts.name ?? '');
  if (nm) {
    const hit = list.find((c) => normalizeCompanyName(c.name) === nm);
    if (hit) return hit;
  }
  return null;
}

export function newCompanyId(year: number = new Date().getFullYear()): string {
  const src =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  return `CMP-${year}-${src.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

export async function saveCompany(
  company: Company
): Promise<{ success: boolean; data?: Company; error?: string }> {
  const list = getLocalData<Company[]>(STORAGE_KEY_COMPANIES, SEED_COMPANIES);
  const idx = list.findIndex((c) => c.id === company.id);
  const now = new Date().toISOString();
  const next =
    idx >= 0
      ? Object.assign([...list], { [idx]: { ...company, updated_at: now } })
      : [{ ...company, created_at: company.created_at || now, updated_at: now }, ...list];
  setLocalData(STORAGE_KEY_COMPANIES, next as Company[]);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('dpp_companies')
        .upsert({
          id: company.id,
          name: company.name,
          biz_no: company.biz_no ?? null,
          representative: company.representative ?? null,
          address: company.address ?? null,
          contact: company.contact ?? null,
          industry: company.industry ?? null,
          roles: company.roles ?? [],
          note: company.note ?? null,
          updated_at: now
        })
        .select()
        .single();

      if (error) {
        // 사업자등록번호 UNIQUE 위반은 사용자에게 그대로 알려야 한다(같은 업체 중복 등록).
        console.warn('[GoDPP] Supabase saveCompany warning:', error.message);
        if (error.code === '23505') {
          return { success: false, error: '이미 등록된 사업자등록번호입니다.' };
        }
      } else if (data) {
        return { success: true, data: data as Company };
      }
    } catch (err: any) {
      console.warn('[GoDPP] Supabase saveCompany error:', err?.message || err);
    }
  }
  return { success: true, data: company };
}

/** 기존 업체를 찾고, 없으면 만든다. 등록 폼이 중복 업체를 만들지 않게 하는 진입점. */
export async function findOrCreateCompany(input: {
  name: string;
  bizNo?: string | null;
  representative?: string | null;
  address?: string | null;
  contact?: string | null;
  industry?: Company['industry'];
  role?: 'fabric_supplier' | 'manufacturer';
}): Promise<Company> {
  const found = await findCompany({ bizNo: input.bizNo, name: input.name });
  if (found) {
    // 역할·연락처 등 빠진 정보만 채워 넣는다(기존 값을 덮어쓰지 않는다).
    const roles = new Set(found.roles ?? []);
    if (input.role) roles.add(input.role);
    const merged: Company = {
      ...found,
      biz_no: found.biz_no ?? input.bizNo ?? null,
      representative: found.representative ?? input.representative ?? null,
      address: found.address ?? input.address ?? null,
      contact: found.contact ?? input.contact ?? null,
      industry: found.industry ?? input.industry ?? null,
      roles: Array.from(roles)
    };
    await saveCompany(merged);
    return merged;
  }

  const created: Company = {
    id: newCompanyId(),
    name: normalizeCompanyName(input.name),
    biz_no: input.bizNo || null,
    representative: input.representative || null,
    address: input.address || null,
    contact: input.contact || null,
    industry: input.industry ?? null,
    roles: input.role ? [input.role] : [],
    created_at: new Date().toISOString()
  };

  const res = await saveCompany(created);
  if (!res.success) {
    // 사업자번호 UNIQUE 위반 = 원격에 같은 회사가 다른 id 로 이미 있다.
    // 새 id 를 그대로 쓰면 제품 저장이 FK 위반으로 실패하므로 원격의 실제 id 를 되찾는다.
    const remote = await findCompany({ bizNo: input.bizNo, name: input.name });
    if (remote) return remote;
    throw new Error(res.error || '업체 등록에 실패했습니다.');
  }
  return created;
}

/** 업체 하나에 걸린 원단·완제품을 한 번에 조회한다(company_id 기준). */
export async function getCompanyPortfolio(companyId: string): Promise<{
  company: Company | null;
  fabrics: FabricDPP[];
  passports: FashionDPP[];
}> {
  const clean = (companyId || '').trim();
  const [company, fabrics, passports] = await Promise.all([
    getCompanyById(clean),
    getFabrics(),
    getPassports()
  ]);
  return {
    company,
    fabrics: fabrics.filter((f) => f.company_id === clean),
    passports: passports.filter((p) => p.company_id === clean)
  };
}

// ---- 업체 담당자 (Auth 도입 시 활성화) ----

export async function getCompanyMembers(companyId?: string): Promise<CompanyMember[]> {
  if (!supabase) return [];
  try {
    let q = supabase.from('dpp_company_members').select('*');
    if (companyId) q = q.eq('company_id', companyId);
    const { data, error } = await q;
    if (!error && data) return data as CompanyMember[];
  } catch (err) {
    console.warn('[GoDPP] Supabase getCompanyMembers fallback:', err);
  }
  return [];
}
