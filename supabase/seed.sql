-- ==============================================================================
-- GoDPP Supabase 초기 시드 데이터 (Seed Data) 삽입 스크립트
-- 대상 테이블: dpp_fabrics, dpp_passports
-- ==============================================================================

-- 1. 원단(소재) 시드 데이터 등록
INSERT INTO public.dpp_fabrics (
    id,
    name,
    supplier_name,
    supplier_country,
    composition,
    weight_gsm,
    weaving_type,
    certifications,
    environmental_impact,
    compliance_data,
    created_at,
    updated_at
) VALUES 
(
    'FAB-2026-ECO-0991',
    '100% GRS 인증 리사이클 립스탑 나일론 3L (DWR PFAS-Free)',
    '(주)에코텍스틸 테크놀로지 코리아',
    'KR',
    '[
        {"material": "Recycled Ocean Nylon (폐어망 추출)", "percentage": 70, "isRecycled": true},
        {"material": "Post-Consumer Recycled PA6", "percentage": 30, "isRecycled": true}
    ]'::jsonb,
    135,
    '3-Layer High-Density Micro Ripstop',
    '[
        {"name": "Global Recycled Standard (GRS 4.0)", "id": "CU-854921-GRS-2026", "issuer": "Control Union Certifications", "validUntil": "2027-12-31", "status": "valid"},
        {"name": "OEKO-TEX® Standard 100 Class I", "id": "SHWO 084321 TESTEX", "issuer": "OEKO-TEX Association", "validUntil": "2027-06-30", "status": "valid"},
        {"name": "bluesign® APPROVED", "id": "BS-KR-88320", "issuer": "bluesign technologies ag", "validUntil": "2028-01-15", "status": "valid"}
    ]'::jsonb,
    '{"carbonKgPerKg": 3.42, "waterLitersPerKg": 42.5, "energyMjPerKg": 58.2, "recycledContentPercentage": 100, "hazardousChemicals": "Zero Detected"}'::jsonb,
    '{"pfasFree": true, "oekoTexStandard": "Class I (Infant/Sensitive Skin Certified)", "reachCompliant": true, "labReportHash": "0x8f2d4e9a1b6c37d8e0f5a2b4c6e8d1a3f5b7c9e2", "labReportDate": "2026-01-15", "testingLab": "SGS Eco-Textile Testing Lab Zurich"}'::jsonb,
    '2026-02-10T09:00:00Z',
    '2026-02-10T09:00:00Z'
),
(
    'FAB-2026-CTN-0412',
    '100% GOTS 유기농 & 재생 코튼 셀비지 데님 (12.5 oz)',
    '신한 친환경 방직 주식회사',
    'KR',
    '[
        {"material": "GOTS Certified Organic Cotton", "percentage": 75, "isOrganic": true},
        {"material": "Pre-Consumer Recycled Cotton", "percentage": 25, "isRecycled": true}
    ]'::jsonb,
    380,
    'Right Hand Twill Selvedge Denim',
    '[
        {"name": "Global Organic Textile Standard (GOTS)", "id": "GOTS-IN-98124", "issuer": "Ecocert Greenlife", "validUntil": "2027-11-20", "status": "valid"},
        {"name": "Cradle to Cradle Certified® (C2C Gold)", "id": "C2C-GLD-2025-441", "issuer": "MBDC Institute", "validUntil": "2027-08-30", "status": "valid"}
    ]'::jsonb,
    '{"carbonKgPerKg": 2.15, "waterLitersPerKg": 85.0, "energyMjPerKg": 34.1, "recycledContentPercentage": 25, "hazardousChemicals": "Zero Detected"}'::jsonb,
    '{"pfasFree": true, "oekoTexStandard": "Class I (Zero Harmful Dyes)", "reachCompliant": true, "labReportHash": "0x4c2a9e7f1b8d30e5a6f2b9c3e7d1a5f8b0c4e6a1", "labReportDate": "2026-01-20", "testingLab": "FITi Testing & Research Institute Korea"}'::jsonb,
    '2026-02-12T10:30:00Z',
    '2026-02-12T10:30:00Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    supplier_name = EXCLUDED.supplier_name,
    supplier_country = EXCLUDED.supplier_country,
    composition = EXCLUDED.composition,
    weight_gsm = EXCLUDED.weight_gsm,
    weaving_type = EXCLUDED.weaving_type,
    certifications = EXCLUDED.certifications,
    environmental_impact = EXCLUDED.environmental_impact,
    compliance_data = EXCLUDED.compliance_data,
    updated_at = NOW();

-- 2. 패션 완제품 여권 시드 데이터 등록
INSERT INTO public.dpp_passports (
    id,
    product_name,
    brand_name,
    category,
    season,
    manufactured_country,
    image_url,
    fabric_id,
    fabric_snapshot,
    materials_summary,
    eco_scores,
    care_instructions,
    circularity_guide,
    supply_chain_journey,
    deep_compliance_data,
    created_at,
    updated_at
) VALUES
(
    'DPP-2026-JKT-0042',
    '아크테라 테크 에코 쉘 3L 하드쉘 자켓',
    'ARCTERA Sustainability (아크테라)',
    'Outerwear (기능성 아웃도어)',
    '2026 S/S Circular Collection',
    'KR (대한민국)',
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
    'FAB-2026-ECO-0991',
    '{"id": "FAB-2026-ECO-0991", "name": "100% GRS 인증 리사이클 립스탑 나일론 3L (DWR PFAS-Free)", "supplier_name": "(주)에코텍스틸 테크놀로지 코리아"}'::jsonb,
    '[
        {"material": "GRS Recycled Ocean Nylon (메인 원단)", "percentage": 88, "isRecycled": true},
        {"material": "Recycled TPU Membrane (투습 방수 멤브레인)", "percentage": 8, "isRecycled": true},
        {"material": "Recycled Poly YKK Natulon 지퍼 & 심실링 테이프", "percentage": 4, "isRecycled": true}
    ]'::jsonb,
    '{"overallScore": 94, "carbonRating": "A+", "totalCarbonKg": 6.84, "durabilityIndex": 9.6, "repairabilityScore": 9.2, "recyclabilityRate": 92}'::jsonb,
    '[
        {"icon": "droplet", "title": "30°C 미온수 중성세제 세탁", "description": "기능성 멤브레인 보호를 위해 표백제 및 섬유유연제 사용을 금지합니다."},
        {"icon": "wind", "title": "저온 회전건조 (DWR 발수코팅 활성화)", "description": "세탁 후 저온 건조(20분)를 통해 표면 발수 기능을 반영구적으로 회복시킵니다."}
    ]'::jsonb,
    '{"repairOptions": "공식 리페어 센터를 통한 심실링 테이프 무상 재접착 및 원단 패치 수선", "takeBackProgram": "수거 시 신제품 15% 보상 할인 쿠폰 지급 및 100% 섬유-to-섬유 리사이클링", "recyclingGuideline": "단일 소재(Monomaterial-like) 설계로 부자재 분리 없이 92% 이상 재활용 가능", "estimatedLifespanYears": 10}'::jsonb,
    '[
        {"step": "Tier 3: 리사이클 원사 추출 & 방적", "tier": "Tier-3", "companyName": "해양 플라스틱 리사이클링 협동조합", "location": "부산광역시 영도구", "country": "KR", "certifications": ["GRS", "Ocean Bound Plastic"], "processDate": "2025-11-10", "verified": true},
        {"step": "Tier 2: 3-Layer 원단 제직 & PFAS-Free 가공", "tier": "Tier-2", "companyName": "(주)에코텍스틸 테크놀로지 코리아", "location": "대구광역시 달서구 성서공단", "country": "KR", "certifications": ["bluesign", "OEKO-TEX Class I"], "processDate": "2025-12-05", "verified": true},
        {"step": "Tier 1: 패턴 재단 & 친환경 초음파 웰딩 봉제", "tier": "Tier-1", "companyName": "아크테라 테크니컬 스마트팩토리", "location": "경기도 안산시 단원구", "country": "KR", "certifications": ["ISO 14001", "SA8000"], "processDate": "2026-01-18", "verified": true}
    ]'::jsonb,
    '{"hsCode": "6201.90.0000 (기능성 아웃도어 의류)", "reachSvhcStatus": "100% Compliant (유해물질 241종 미검출)", "lcaScope": "Cradle-to-Grave (Scope 1: 0.82kg, Scope 2: 1.45kg, Scope 3: 4.57kg)", "smartContractAddress": "0x3D72aB41c9B4F8e310024976a264aD821Ce763F9", "blockchainTxHash": "0x9e12f6b8a2304918237492183749123847912837491283749128374912837491", "verifierSignature": "SIG_ED25519_KR_SUSTAINABILITY_AUTHORITY_2026_0991", "verifierOrg": "한국환경산업기술원(KEITI) & TÜV Rheinland Korea", "verificationTimestamp": "2026-02-28T14:22:00Z"}'::jsonb,
    '2026-03-01T10:00:00Z',
    '2026-03-01T10:00:00Z'
),
(
    'DPP-2026-DNM-0188',
    '오가닉 서큘러 셀비지 데님 팬츠 (Straight Fit)',
    'BLUE REVOLUTION Studio',
    'Denim (데님/팬츠)',
    '2026 S/S Timeless Eco',
    'KR (대한민국)',
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
    'FAB-2026-CTN-0412',
    '{"id": "FAB-2026-CTN-0412", "name": "100% GOTS 유기농 & 재생 코튼 셀비지 데님 (12.5 oz)", "supplier_name": "신한 친환경 방직 주식회사"}'::jsonb,
    '[
        {"material": "GOTS Organic Cotton", "percentage": 75, "isOrganic": true},
        {"material": "Pre-Consumer Recycled Cotton", "percentage": 25, "isRecycled": true}
    ]'::jsonb,
    '{"overallScore": 91, "carbonRating": "A", "totalCarbonKg": 4.35, "durabilityIndex": 9.8, "repairabilityScore": 9.5, "recyclabilityRate": 98}'::jsonb,
    '[
        {"icon": "droplet", "title": "찬물 단독 세탁 또는 에어워시 권장", "description": "잦은 물세탁 대신 통풍 건조를 권장하며, 탈색 방지를 위해 뒤집어서 세탁하세요."},
        {"icon": "wind", "title": "건조기 사용 금지, 그늘 건조", "description": "자연 섬유 수축 방지 및 데님 고유의 워싱 페이딩 유지를 위해 그늘에서 건조하세요."}
    ]'::jsonb,
    '{"repairOptions": "밑단 롤업 마모 시 무료 셀비지 재봉 보수 지원", "takeBackProgram": "수거 후 분쇄하여 신규 원사(25% 함유)로 100% 업사이클링", "recyclingGuideline": "금속 리벳을 나사형으로 교체하여 도구 없이 10초 내 100% 분해 가능", "estimatedLifespanYears": 15}'::jsonb,
    '[
        {"step": "Tier 3: 유기농 목화 재배 & 유기농 방적", "tier": "Tier-3", "companyName": "신한 친환경 방직 주식회사", "location": "충청남도 천안시", "country": "KR", "certifications": ["GOTS", "Fair Trade"], "processDate": "2025-11-20", "verified": true},
        {"step": "Tier 2: 셔틀 직기 셀비지 데님 제직 & 천연 인디고 염색", "tier": "Tier-2", "companyName": "신한 친환경 방직 제직사업부", "location": "충청남도 천안시", "country": "KR", "certifications": ["C2C Gold", "OEKO-TEX"], "processDate": "2025-12-15", "verified": true},
        {"step": "Tier 1: 친환경 레이저 워싱 & 체인스티치 봉제", "tier": "Tier-1", "companyName": "블루레볼루션 서울 아틀리에", "location": "서울특별시 성동구 성수동", "country": "KR", "certifications": ["ISO 14001", "Zero Discharge of Hazardous Chemicals(ZDHC)"], "processDate": "2026-02-05", "verified": true}
    ]'::jsonb,
    '{"hsCode": "6203.42.1000 (남성/공용 면 데님 팬츠)", "reachSvhcStatus": "100% Compliant (유해 아조염료 0%)", "lcaScope": "Cradle-to-Grave (Scope 1: 0.51kg, Scope 2: 1.12kg, Scope 3: 2.72kg)", "smartContractAddress": "0x7F1a9cB39dE4E2C7894aB3201dCe8923aA129088", "blockchainTxHash": "0x3a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456789abcdef012", "verifierSignature": "SIG_ED25519_KR_SUSTAINABILITY_AUTHORITY_2026_0188", "verifierOrg": "한국의류시험연구원(KATRI) & Control Union Korea", "verificationTimestamp": "2026-02-28T16:40:00Z"}'::jsonb,
    '2026-03-01T11:00:00Z',
    '2026-03-01T11:00:00Z'
)
ON CONFLICT (id) DO UPDATE SET
    product_name = EXCLUDED.product_name,
    brand_name = EXCLUDED.brand_name,
    category = EXCLUDED.category,
    season = EXCLUDED.season,
    manufactured_country = EXCLUDED.manufactured_country,
    image_url = EXCLUDED.image_url,
    fabric_id = EXCLUDED.fabric_id,
    fabric_snapshot = EXCLUDED.fabric_snapshot,
    materials_summary = EXCLUDED.materials_summary,
    eco_scores = EXCLUDED.eco_scores,
    care_instructions = EXCLUDED.care_instructions,
    circularity_guide = EXCLUDED.circularity_guide,
    supply_chain_journey = EXCLUDED.supply_chain_journey,
    deep_compliance_data = EXCLUDED.deep_compliance_data,
    updated_at = NOW();
