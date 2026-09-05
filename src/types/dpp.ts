import type { DomesticOrigin } from './domesticCert';

export type UserRole =
  | 'consumer'
  | 'manufacturer'
  | 'fabric_supplier'
  | 'verifier'
  | 'cert_auditor';

export interface MaterialComposition {
  material: string;
  percentage: number;
  isRecycled?: boolean;
  isOrganic?: boolean;
  /** 국산 소재 여부. 국산 혼용률(참고 지표) 산출 근거 */
  isDomestic?: boolean;
}

export interface Certification {
  name: string;
  id: string;
  issuer: string;
  validUntil: string;
  verificationUrl?: string;
  status: 'valid' | 'expired' | 'pending';
}

export interface EnvironmentalImpact {
  carbonKgPerKg: number; // kg CO2e per kg
  waterLitersPerKg: number; // L per kg
  energyMjPerKg: number; // MJ per kg
  recycledContentPercentage: number;
  hazardousChemicals: 'Zero Detected' | 'Compliant' | 'SVHC < 0.1%';
}

export interface FabricDPP {
  id: string; // e.g. FAB-2026-ECO-0991
  name: string;
  supplier_name: string;
  supplier_country: string;
  composition: MaterialComposition[];
  weight_gsm: number;
  weaving_type?: string;
  certifications: Certification[];
  environmental_impact: EnvironmentalImpact;
  compliance_data: {
    pfasFree: boolean;
    oekoTexStandard: string;
    reachCompliant: boolean;
    labReportHash: string;
    labReportDate: string;
    testingLab: string;
  };
  /** 공정별 국산 여부(원사/제직·편직/염색·가공). 없으면 '미확인'이며 '국외'가 아니다. */
  domestic_origin?: DomesticOrigin;
  /** 소유 업체(dpp_companies.id). supplier_name 은 발급 시점 표기 스냅샷이고 이 값이 정본이다. */
  company_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CareInstruction {
  icon: string;
  title: string;
  description: string;
}

export interface SupplyChainStep {
  step: string;
  tier: string;
  companyName: string;
  location: string;
  country: string;
  certifications: string[];
  processDate?: string;
  verified: boolean;
}

export interface DeepComplianceData {
  lcaMethodology: string; // ISO 14040/44 Ecoinvent 3.9
  scope1EmissionsKg: number;
  scope2EmissionsKg: number;
  scope3EmissionsKg: number;
  svhcChemicalStatus: string;
  tariffsCode: string; // HS Code
  customsDeclarationId: string;
  smartContractAddress?: string;
  blockchainTxHash?: string;
  verifierSignature: string;
  verifierOrg: string;
  verificationTimestamp: string;
}

export interface EcoScores {
  overallScore: number; // 0-100
  carbonRating: 'A+' | 'A' | 'B' | 'C' | 'D';
  totalCarbonKg: number; // kg CO2e per item
  durabilityIndex: number; // 1-10
  repairabilityScore: number; // 1-10
  recyclabilityRate: number; // %
}

export interface FashionDPP {
  id: string; // e.g. DPP-2026-JKT-0042
  product_name: string;
  brand_name: string;
  category: string;
  season: string;
  manufactured_country: string;
  image_url: string;
  fabric_id?: string;
  fabric_snapshot?: FabricDPP;
  materials_summary: MaterialComposition[];
  eco_scores: EcoScores;
  care_instructions: CareInstruction[];
  circularity_guide: {
    repairOptions: string;
    takeBackProgram: string;
    recyclingGuideline: string;
    estimatedLifespanYears: number;
  };
  supply_chain_journey: SupplyChainStep[];
  deep_compliance_data: DeepComplianceData;
  /** 완제품 공정 국산 여부. 봉제(is_domestic_sewing) + 원단에서 상속되지 않은 값 */
  domestic_origin?: DomesticOrigin;
  /** 소유 업체(dpp_companies.id). brand_name 은 발급 시점 표기 스냅샷이고 이 값이 정본이다. */
  company_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  passport_id: string;
  accessor_role: string;
  accessor_name: string;
  action: string;
  details?: Record<string, any>;
  created_at: string;
}
