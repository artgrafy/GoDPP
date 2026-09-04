import { createClient } from '@supabase/supabase-js';
import { FabricDPP, FashionDPP, AuditLog } from '@/types/dpp';
import { SEED_FABRICS, SEED_PASSPORTS } from './seedData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jftsdfkohskbuunptkrh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// 로컬스토리지 키
const STORAGE_KEY_FABRICS = 'godpp_fabrics_v3';
const STORAGE_KEY_PASSPORTS = 'godpp_passports_v3';
const STORAGE_KEY_LOGS = 'godpp_audit_logs_v3';

// 이미지 URL 자동 보정 맵 (부적절/깨진 이미지 -> 고화질 매칭 이미지)
const BROKEN_IMAGE_FALLBACKS: Record<string, string> = {
  'https://images.unsplash.com/photo-1542272604-780c96856592': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1544441893-675973e31985': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
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
        // 성공 시 로컬에도 동기화
        setLocalData(STORAGE_KEY_FABRICS, data);
        return data as FabricDPP[];
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
        return data as FabricDPP;
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
    try {
      const { data, error } = await supabase
        .from('dpp_fabrics')
        .upsert({
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
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.warn('[GoDPP] Supabase saveFabric warning:', error.message);
      } else if (data) {
        return { success: true, data: data as FabricDPP };
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
        setLocalData(STORAGE_KEY_PASSPORTS, data);
        return data as FashionDPP[];
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
        return data as FashionDPP;
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
    try {
      const { data, error } = await supabase
        .from('dpp_passports')
        .upsert({
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
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.warn('[GoDPP] Supabase savePassport warning:', error.message);
      } else if (data) {
        return { success: true, data: data as FashionDPP };
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
