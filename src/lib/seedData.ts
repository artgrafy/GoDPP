import { FabricDPP, FashionDPP } from '@/types/dpp';
import type { Company } from '@/types/domesticCert';

export const SEED_FABRICS: FabricDPP[] = [
  {
    id: 'FAB-2026-ECO-0991',
    company_id: 'CMP-2026-DEMO0001',
    name: '100% GRS 인증 리사이클 립스탑 나일론 3L (DWR PFAS-Free)',
    supplier_name: '(주)에코텍스틸 테크놀로지 코리아',
    supplier_country: 'KR',
    composition: [
      { material: 'Recycled Ocean Nylon (폐어망 추출)', percentage: 70, isRecycled: true, isDomestic: true },
      { material: 'Post-Consumer Recycled PA6', percentage: 30, isRecycled: true, isDomestic: true }
    ],
    weight_gsm: 135,
    weaving_type: '3-Layer High-Density Micro Ripstop',
    certifications: [
      {
        name: 'Global Recycled Standard (GRS 4.0)',
        id: 'CU-854921-GRS-2026',
        issuer: 'Control Union Certifications',
        validUntil: '2027-12-31',
        status: 'valid'
      },
      {
        name: 'OEKO-TEX® Standard 100 Class I',
        id: 'SHWO 084321 TESTEX',
        issuer: 'OEKO-TEX Association',
        validUntil: '2027-06-30',
        status: 'valid'
      },
      {
        name: 'bluesign® APPROVED',
        id: 'BS-KR-88320',
        issuer: 'bluesign technologies ag',
        validUntil: '2028-01-15',
        status: 'valid'
      }
    ],
    environmental_impact: {
      carbonKgPerKg: 3.42,
      waterLitersPerKg: 42.5,
      energyMjPerKg: 58.2,
      recycledContentPercentage: 100,
      hazardousChemicals: 'Zero Detected'
    },
    compliance_data: {
      pfasFree: true,
      oekoTexStandard: 'Class I (Infant/Sensitive Skin Certified)',
      reachCompliant: true,
      labReportHash: '0x8f2d4e9a1b6c37d8e0f5a2b4c6e8d1a3f5b7c9e2',
      labReportDate: '2026-01-15',
      testingLab: 'SGS Eco-Textile Testing Lab Zurich'
    },
    domestic_origin: {
      is_domestic_yarn: true,
      is_domestic_weaving: true,
      is_domestic_dyeing: true,
      processes: {
        yarn: { companyName: '한신 화섬 테크 (Spinning Mill)', location: '경상북도 구미시', processDate: '2025-12-10' },
        weaving: { companyName: '(주)에코텍스틸 테크놀로지 코리아', location: '대구광역시 달서구', processDate: '2026-01-10' },
        dyeing: { companyName: '(주)에코텍스틸 테크놀로지 코리아', location: '대구광역시 달서구', processDate: '2026-01-18' }
      },
      evidence: [
        {
          type: 'transaction_certificate',
          label: 'GRS 거래증명서(TC) — 리사이클 나일론 원사 투입',
          refNo: 'TC-GRS-2026-00841',
          issuedDate: '2025-12-12',
          issuer: 'Control Union Certifications'
        }
      ]
    },
    created_at: '2026-02-10T09:00:00Z',
    updated_at: '2026-02-10T09:00:00Z'
  },
  {
    id: 'FAB-2026-CTN-0412',
    company_id: 'CMP-2026-DEMO0005',
    name: '100% GOTS 유기농 & 재생 코튼 셀비지 데님 (12.5 oz)',
    supplier_name: '신한 친환경 방직 주식회사',
    supplier_country: 'KR',
    composition: [
      // 원면은 인도산 유기농 목화를 수입하고, 방적·제직·염색은 국내에서 수행한다.
      // → 소재 기준 국산 혼용률은 25%지만 공정 기준 트랙(T2)은 적격. 두 지표가 다른 것을 보여주는 사례.
      { material: 'GOTS Certified Organic Cotton', percentage: 75, isOrganic: true, isDomestic: false },
      { material: 'Pre-Consumer Recycled Cotton', percentage: 25, isRecycled: true, isDomestic: true }
    ],
    weight_gsm: 380,
    weaving_type: 'Right Hand Twill Selvedge Denim',
    certifications: [
      {
        name: 'Global Organic Textile Standard (GOTS)',
        id: 'GOTS-IN-98124',
        issuer: 'Ecocert Greenlife',
        validUntil: '2027-11-20',
        status: 'valid'
      },
      {
        name: 'Cradle to Cradle Certified® (C2C Gold)',
        id: 'C2C-GLD-2025-441',
        issuer: 'MBDC Institute',
        validUntil: '2027-08-30',
        status: 'valid'
      }
    ],
    environmental_impact: {
      carbonKgPerKg: 2.15,
      waterLitersPerKg: 85.0,
      energyMjPerKg: 34.1,
      recycledContentPercentage: 25,
      hazardousChemicals: 'Zero Detected'
    },
    compliance_data: {
      pfasFree: true,
      oekoTexStandard: 'Class I (Zero Harmful Dyes)',
      reachCompliant: true,
      labReportHash: '0x4c2a9e7f1b8d30e5a6f2b9c3e7d1a5f8b0c4e6a1',
      labReportDate: '2026-01-20',
      testingLab: 'FITi Testing & Research Institute Korea'
    },
    domestic_origin: {
      is_domestic_yarn: true,
      is_domestic_weaving: true,
      is_domestic_dyeing: true,
      processes: {
        yarn: { companyName: '신한 친환경 방직 주식회사', location: '충청남도 천안시', processDate: '2025-11-20' },
        weaving: { companyName: '한국 데님 마이스터 팩토리', location: '전라북도 전주시', processDate: '2025-12-22' },
        dyeing: { companyName: '한국 데님 마이스터 팩토리', location: '전라북도 전주시', processDate: '2026-01-05' }
      },
      evidence: [
        {
          type: 'transaction_certificate',
          label: 'GOTS 거래증명서(TC) — 유기농 원면 수입 및 국내 방적',
          refNo: 'TC-GOTS-2025-11204',
          issuedDate: '2025-11-25',
          issuer: 'Ecocert Greenlife'
        }
      ],
      note: '원면은 인도산 GOTS 유기농 목화 수입, 방적 이후 전 공정 국내 수행'
    },
    created_at: '2026-02-12T10:30:00Z',
    updated_at: '2026-02-12T10:30:00Z'
  }
];

export const SEED_PASSPORTS: FashionDPP[] = [
  {
    id: 'DPP-2026-JKT-0042',
    company_id: 'CMP-2026-DEMO0002',
    product_name: '아크테라 테크 에코 쉘 3L 하드쉘 자켓',
    brand_name: 'ARCTERA Sustainability (아크테라)',
    category: 'Outerwear (기능성 아웃도어)',
    season: '2026 S/S Circular Collection',
    manufactured_country: 'KR (대한민국)',
    image_url: 'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=1000&q=80',
    fabric_id: 'FAB-2026-ECO-0991',
    fabric_snapshot: SEED_FABRICS[0],
    materials_summary: [
      { material: 'GRS Recycled Ocean Nylon (메인 원단)', percentage: 88, isRecycled: true, isDomestic: true },
      { material: 'Recycled TPU Membrane (투습 방수 멤브레인)', percentage: 8, isRecycled: true, isDomestic: true },
      { material: 'Recycled Poly YKK Natulon 지퍼 & 심실링 테이프', percentage: 4, isRecycled: true, isDomestic: true }
    ],
    eco_scores: {
      overallScore: 94,
      carbonRating: 'A+',
      totalCarbonKg: 6.84, // 일반 자켓(약 22kg) 대비 69% 감축
      durabilityIndex: 9.6,
      repairabilityScore: 9.2,
      recyclabilityRate: 92
    },
    care_instructions: [
      {
        icon: 'droplet',
        title: '30°C 미온수 중성세제 세탁',
        description: '표백제 및 섬유유연제 사용 금지, 세탁망을 사용하여 미세플라스틱 유출을 방지하세요.'
      },
      {
        icon: 'wind',
        title: '자연 건조 및 약한 열 다림질',
        description: '그늘에서 눕혀 건조 후 저온(110°C 이하) 다림질로 DWR 발수 코팅을 활성화할 수 있습니다.'
      },
      {
        icon: 'wrench',
        title: '평생 무상 심실링 수리 보증',
        description: '지퍼 고장, 원단 찢어짐 발생 시 GoDPP 공식 수리 센터에서 즉시 무상 복원됩니다.'
      }
    ],
    circularity_guide: {
      repairOptions: '전국 14개 지정 아웃도어 수리 허브 및 택배 수리 지원 (평균 수리 소요 3일)',
      takeBackProgram: '제품 수명 종료 시 매장 반납 시 다음 구매 25% 보상 크레딧 지급',
      recyclingGuideline: '부자재(지퍼/단추) 분리형 모듈러 설계로 100% 화학적 재생 나일론 원사로 재환원 가능',
      estimatedLifespanYears: 10
    },
    supply_chain_journey: [
      {
        step: 'Tier 4: 원자재 수거 & 리사이클링',
        tier: 'Tier-4',
        companyName: '동해 해양 플라스틱 리사이클링 협동조합',
        location: '강원도 강릉시',
        country: 'KR',
        certifications: ['Ocean Bound Plastic', 'GRS 4.0'],
        processDate: '2025-11-04',
        verified: true
      },
      {
        step: 'Tier 3: 고강도 리사이클 원사 방적',
        tier: 'Tier-3',
        companyName: '한신 화섬 테크 (Spinning Mill)',
        location: '경상북도 구미시',
        country: 'KR',
        certifications: ['OEKO-TEX Standard 100', 'ISO 14001'],
        processDate: '2025-12-10',
        verified: true
      },
      {
        step: 'Tier 2: 3L 원단 직조 & 친환경 DWR 가공',
        tier: 'Tier-2',
        companyName: '(주)에코텍스틸 테크놀로지 코리아',
        location: '대구광역시 달서구',
        country: 'KR',
        certifications: ['bluesign®', 'GRS 4.0', 'PFAS-Free'],
        processDate: '2026-01-18',
        verified: true
      },
      {
        step: 'Tier 1: 패턴 커팅 & 정밀 심실링 봉제',
        tier: 'Tier-1',
        companyName: '아크테라 스마트 팩토리 No.1',
        location: '부산광역시 강서구',
        country: 'KR',
        certifications: ['SA8000 (공정무역/노동인권)', 'ISO 9001'],
        processDate: '2026-02-15',
        verified: true
      }
    ],
    deep_compliance_data: {
      lcaMethodology: 'ISO 14040/44 Ecoinvent 3.9 (PEFCR Apparel & Footwear v1.2)',
      scope1EmissionsKg: 0.82,
      scope2EmissionsKg: 1.45,
      scope3EmissionsKg: 4.57,
      svhcChemicalStatus: 'SVHC 240종 전수 검사 불검출 (< 0.01% w/w)',
      tariffsCode: '6201.93.0000 (아웃도어 기능성 방수 외투)',
      customsDeclarationId: 'KR-CUSTOMS-2026-DPP-774921',
      smartContractAddress: '0x3D72aB41c9B4F8e310024976a264aD821Ce763F9',
      blockchainTxHash: '0x9e12f6b8a2304918237492183749123847912837491283749128374912837491',
      verifierSignature: 'SIG_ED25519_KR_SUSTAINABILITY_AUTHORITY_2026_0991',
      verifierOrg: '한국환경산업기술원(KEITI) & TÜV Rheinland Korea',
      verificationTimestamp: '2026-02-28T14:22:00Z'
    },
    // 원사/제직/염가공은 FAB-2026-ECO-0991에서 상속된다. 봉제만 완제품이 선언한다. → T3
    domestic_origin: {
      is_domestic_sewing: true,
      processes: {
        sewing: {
          companyName: '아크테라 스마트 팩토리 No.1',
          location: '부산광역시 강서구',
          processDate: '2026-02-15'
        }
      }
    },
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 'DPP-2026-DNM-0188',
    company_id: 'CMP-2026-DEMO0003',
    product_name: '오가닉 서큘러 셀비지 데님 팬츠 (Straight Fit)',
    brand_name: 'BLUE REVOLUTION Studio',
    category: 'Denim (데님/팬츠)',
    season: '2026 S/S Timeless Eco',
    manufactured_country: 'KR (대한민국)',
    image_url: 'https://images.unsplash.com/photo-1631112213238-b1bafeaecff3?auto=format&fit=crop&w=1000&q=80',
    fabric_id: 'FAB-2026-CTN-0412',
    fabric_snapshot: SEED_FABRICS[1],
    materials_summary: [
      { material: 'GOTS Organic Cotton', percentage: 75, isOrganic: true, isDomestic: false },
      { material: 'Pre-Consumer Recycled Cotton', percentage: 25, isRecycled: true, isDomestic: true }
    ],
    eco_scores: {
      overallScore: 91,
      carbonRating: 'A',
      totalCarbonKg: 4.35,
      durabilityIndex: 9.8,
      repairabilityScore: 9.5,
      recyclabilityRate: 98
    },
    care_instructions: [
      {
        icon: 'droplet',
        title: '찬물 단독 세탁 또는 에어워시 권장',
        description: '잦은 물세탁 대신 통풍 건조를 권장하며, 탈색 방지를 위해 뒤집어서 세탁하세요.'
      },
      {
        icon: 'wind',
        title: '건조기 사용 금지, 그늘 건조',
        description: '자연 섬유 수축 방지 및 데님 고유의 워싱 페이딩 유지를 위해 그늘에서 건조하세요.'
      }
    ],
    circularity_guide: {
      repairOptions: '밑단 롤업 마모 시 무료 셀비지 재봉 보수 지원',
      takeBackProgram: '수거 후 분쇄하여 신규 원사(25% 함유)로 100% 업사이클링',
      recyclingGuideline: '금속 리벳을 나사형으로 교체하여 도구 없이 10초 내 100% 분해 가능',
      estimatedLifespanYears: 15
    },
    supply_chain_journey: [
      {
        step: 'Tier 3: 유기농 목화 재배 & 유기농 방적',
        tier: 'Tier-3',
        companyName: '신한 친환경 방직 주식회사',
        location: '충청남도 천안시',
        country: 'KR',
        certifications: ['GOTS', 'Fair Trade'],
        processDate: '2025-11-20',
        verified: true
      },
      {
        step: 'Tier 2: 무폐수 인디고 천연 염색 & 셀비지 직조',
        tier: 'Tier-2',
        companyName: '한국 데님 마이스터 팩토리',
        location: '전라북도 전주시',
        country: 'KR',
        certifications: ['OEKO-TEX Step', 'Zero Liquid Discharge'],
        processDate: '2026-01-05',
        verified: true
      },
      {
        step: 'Tier 1: 무수(Waterless) 오존 워싱 & 장인 봉제',
        tier: 'Tier-1',
        companyName: '블루 레볼루션 아틀리에',
        location: '서울특별시 성동구 성수동',
        country: 'KR',
        certifications: ['ISO 14001', 'Eco-Factory'],
        processDate: '2026-02-18',
        verified: true
      }
    ],
    deep_compliance_data: {
      lcaMethodology: 'ISO 14040/44 Cradle to Grave Ecoinvent 3.9',
      scope1EmissionsKg: 0.55,
      scope2EmissionsKg: 1.10,
      scope3EmissionsKg: 2.70,
      svhcChemicalStatus: '유해 화학물질 100% 불검출',
      tariffsCode: '6203.42.1000 (남성/공용 면제 바지)',
      customsDeclarationId: 'KR-CUSTOMS-2026-DPP-883921',
      smartContractAddress: '0x71C2b84F810024976a264aD821Ce763F93D72aB4',
      blockchainTxHash: '0x182374921837491238479128374912837491283749128374919e12f6b8a23049',
      verifierSignature: 'SIG_ED25519_KR_ECOLABEL_2026_0412',
      verifierOrg: 'FITI 시험연구원 & SGS Korea',
      verificationTimestamp: '2026-02-25T11:00:00Z'
    },
    // 원사/제직/염가공은 FAB-2026-CTN-0412에서 상속. 봉제 국내 → T3.
    // 단 소재 기준 국산 혼용률은 25%(원면 인도산)로, 트랙 판정과 혼용률이 별개임을 보여준다.
    domestic_origin: {
      is_domestic_sewing: true,
      processes: {
        sewing: {
          companyName: '블루 레볼루션 아틀리에',
          location: '서울특별시 성동구 성수동',
          processDate: '2026-02-18'
        }
      }
    },
    created_at: '2026-03-02T11:00:00Z',
    updated_at: '2026-03-02T11:00:00Z'
  }
];

/**
 * 업체 마스터 시드.
 * 원단/완제품은 이름이 아니라 이 id(company_id)로 묶인다 — 이름은 공백 하나에 깨진다.
 */
export const SEED_COMPANIES: Company[] = [
  {
    id: 'CMP-2026-DEMO0001',
    name: '(주)에코텍스틸 테크놀로지 코리아',
    biz_no: '502-81-33914',
    representative: '문서현',
    address: '대구광역시 달서구 성서공단로 214',
    contact: 'cert@ecotextil.example.kr',
    industry: 'fabric',
    roles: ['fabric_supplier'],
    created_at: '2026-01-28T09:00:00Z'
  },
  {
    id: 'CMP-2026-DEMO0002',
    name: 'ARCTERA Sustainability (아크테라)',
    biz_no: '214-88-01923',
    representative: '정유진',
    address: '부산광역시 강서구 녹산산업중로 100',
    contact: 'compliance@arctera.example.kr',
    industry: 'fashion',
    roles: ['manufacturer'],
    created_at: '2026-02-10T09:00:00Z'
  },
  {
    id: 'CMP-2026-DEMO0003',
    name: 'BLUE REVOLUTION Studio',
    biz_no: '110-81-77412',
    representative: '한도연',
    address: '서울특별시 성동구 성수이로 51',
    contact: 'cert@bluerevolution.example.kr',
    industry: 'fashion',
    roles: ['manufacturer'],
    created_at: '2026-08-20T10:00:00Z'
  },
  {
    // 원단 시드 FAB-2026-CTN-0412 의 공급사
    id: 'CMP-2026-DEMO0005',
    name: '신한 친환경 방직 주식회사',
    industry: 'fabric',
    roles: ['fabric_supplier'],
    created_at: '2026-02-12T10:30:00Z'
  }
];