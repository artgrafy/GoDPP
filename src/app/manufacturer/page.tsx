'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { FilterPills, FilterSelect, ListToolbar } from '@/components/ListToolbar';
import {
  getPassports,
  getFabrics,
  savePassport,
  findOrCreateCompany
} from '@/lib/supabase';
import { FashionDPP, FabricDPP } from '@/types/dpp';
import type { TriState } from '@/types/domesticCert';
import { PROCESS_LABEL, summarizeDomesticProcesses } from '@/lib/domesticCert';
import { QRGeneratorModal } from '@/components/QRGeneratorModal';
import {
  QrCode,
  Plus,
  Layers,
  Shirt,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Building2,
  Save,
  ArrowRight,
  UploadCloud,
  ImageIcon,
  RefreshCw,
  X,
  AlertTriangle,
  BadgeCheck,
  CircleHelp,
  XCircle,
  Factory
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  'Outerwear (기능성 아웃도어/자켓/코트)',
  'Tops (티셔츠/셔츠/맨투맨/니트)',
  'Bottoms (팬츠/슬랙스/데님/청바지)',
  'Dress / One-piece (원피스/점프수트)',
  'Sportswear (스포츠/애슬레저/트레이닝)',
  'Underwear / Loungewear (속옷/이지웨어)',
  'Footwear / Bags (신발/가방/잡화)',
  '직접 입력'
];

const SEASON_OPTIONS = [
  '2026 S/S Circular Collection',
  '2026 F/W Circular Collection',
  '2026 S/S Timeless Eco',
  '2026 F/W Eco Tech',
  '2027 S/S Future Sustainability',
  '2027 F/W Net-Zero Line',
  'All Season / Carry-Over (상시/시즌리스)',
  '직접 입력'
];

const PRESET_IMAGES = [
  { label: '🧥 기능성 자켓', url: 'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=1000&q=80' },
  { label: '👖 오가닉 데님', url: 'https://images.unsplash.com/photo-1631112213238-b1bafeaecff3?auto=format&fit=crop&w=1000&q=80' },
  { label: '👔 코튼 셔츠', url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80' },
  { label: '🧶 에코 니트', url: 'https://images.unsplash.com/photo-1574201635302-388dd92a4c3f?auto=format&fit=crop&w=1000&q=80' },
  { label: '👕 베이직 티셔츠', url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=80' },
  { label: '👗 에코 드레스', url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=80' },
];

export default function ManufacturerDashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [passports, setPassports] = useState<FashionDPP[]>([]);
  const [fabrics, setFabrics] = useState<FabricDPP[]>([]);
  const [selectedQR, setSelectedQR] = useState<FashionDPP | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 목록 필터
  const [listQuery, setListQuery] = useState('');
  const [listBrand, setListBrand] = useState('');
  const [listSeason, setListSeason] = useState('');
  const [listFabricLink, setListFabricLink] = useState('');

  // 카테고리 & 시즌 선택 상태
  const [selectedCategoryOption, setSelectedCategoryOption] = useState(CATEGORY_OPTIONS[0]);
  const [customCategory, setCustomCategory] = useState('');
  
  const [selectedSeasonOption, setSelectedSeasonOption] = useState(SEASON_OPTIONS[0]);
  const [customSeason, setCustomSeason] = useState('');

  // 폼 상태
  const [formData, setFormData] = useState({
    product_name: '',
    brand_name: 'ARCTERA Sustainability',
    manufactured_country: 'KR (대한민국)',
    image_url: '',
    selected_fabric_id: '',
    totalCarbonKg: 7.2,
    repairabilityScore: 9.0,
    recyclabilityRate: 90,
    // 봉제 공정 (완제품이 직접 선언하는 유일한 공정). 기본값은 '미확인'.
    isDomesticSewing: null as TriState,
    sewingCompany: '',
    sewingLocation: ''
  });

  async function refresh() {
    const [p, f] = await Promise.all([getPassports(), getFabrics()]);
    setPassports(p);
    setFabrics(f);
    return f;
  }

  useEffect(() => {
    (async () => {
      const f = await refresh();
      if (f.length > 0) {
        setFormData((prev) => ({ ...prev, selected_fabric_id: prev.selected_fabric_id || f[0].id }));
      }
    })();
  }, []);

  // 이미지 파일 업로드 & 브라우저 캔버스 최적화 압축
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(PNG, JPG, JPEG, WebP 등)만 업로드 가능합니다.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFormData((prev) => ({ ...prev, image_url: dataUrl }));
        }
        setIsUploading(false);
      };
      img.onerror = () => {
        setIsUploading(false);
        alert('이미지 로딩에 실패했습니다.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePassport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_name) return;

    setSaving(true);
    try {
      const finalCategory = selectedCategoryOption === '직접 입력' ? (customCategory.trim() || 'Outerwear') : selectedCategoryOption;
      const finalSeason = selectedSeasonOption === '직접 입력' ? (customSeason.trim() || '2026 S/S Circular') : selectedSeasonOption;
      const selectedFabric = fabrics.find((f) => f.id === formData.selected_fabric_id);
      const categoryTag = finalCategory.split(' ')[0].replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'APP';
      const newId = `DPP-2026-${categoryTag}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 브랜드를 업체 마스터에 연결한다(없으면 생성). brand_name 은 표기 스냅샷으로 남는다.
      const master = await findOrCreateCompany({
        name: formData.brand_name,
        role: 'manufacturer'
      });

      const newPassport: FashionDPP = {
        id: newId,
        company_id: master.id,
        product_name: formData.product_name,
        brand_name: formData.brand_name,
        category: finalCategory,
        season: finalSeason,
        manufactured_country: formData.manufactured_country,
        image_url: formData.image_url || PRESET_IMAGES[0].url,
        fabric_id: formData.selected_fabric_id,
        fabric_snapshot: selectedFabric,
        materials_summary: selectedFabric ? selectedFabric.composition : [
          { material: 'Recycled Fiber', percentage: 100, isRecycled: true }
        ],
        eco_scores: {
          overallScore: 92,
          carbonRating: 'A+',
          totalCarbonKg: Number(formData.totalCarbonKg),
          durabilityIndex: 9.5,
          repairabilityScore: Number(formData.repairabilityScore),
          recyclabilityRate: Number(formData.recyclabilityRate)
        },
        care_instructions: [
          {
            icon: 'droplet',
            title: '30°C 친환경 중성세제 세탁',
            description: '미세플라스틱 저감 세탁망 권장 및 저온 세탁'
          },
          {
            icon: 'wind',
            title: '자연 건조 및 수명 연장',
            description: '직사광선을 피한 그늘 건조로 원단 내구성 보존'
          }
        ],
        circularity_guide: {
          repairOptions: '공식 AS 센터를 통한 무상 수리 및 지퍼 교체 지원',
          takeBackProgram: '수명 종료 후 매장 반납 시 20% 리사이클 보상 바우처 지급',
          recyclingGuideline: '단일 소재 분해 설계로 100% 화학 재생 공정 투입 가능',
          estimatedLifespanYears: 8
        },
        supply_chain_journey: [
          {
            step: 'Tier 3: 친환경 원사 방적',
            tier: 'Tier-3',
            companyName: '에코 파이버 스피닝 코리아',
            location: '경상북도 구미시',
            country: 'KR',
            certifications: ['GRS', 'OEKO-TEX'],
            processDate: '2026-01-10',
            verified: true
          },
          {
            step: 'Tier 2: 원단 직조 및 무독성 가공',
            tier: 'Tier-2',
            companyName: selectedFabric?.supplier_name || '원단 공급 파트너사',
            location: '대구광역시',
            country: selectedFabric?.supplier_country || 'KR',
            certifications: selectedFabric?.certifications.map((c) => c.name) || ['bluesign®'],
            processDate: '2026-02-05',
            verified: true
          },
          {
            step: 'Tier 1: 완제품 패턴 봉제 및 품질 검사',
            tier: 'Tier-1',
            // 폼에서 입력받은 봉제 공장을 그대로 쓴다 (입력값과 타임라인이 어긋나지 않게).
            companyName: formData.sewingCompany.trim() || '아크테라 스마트 에코 팩토리',
            location: formData.sewingLocation.trim() || '부산광역시 강서구',
            country: formData.isDomesticSewing === false ? 'FOREIGN' : 'KR',
            certifications: ['SA8000', 'ISO 14001'],
            processDate: '2026-03-01',
            verified: true
          }
        ],
        deep_compliance_data: {
          lcaMethodology: 'ISO 14040/44 Ecoinvent 3.9 (PEFCR)',
          scope1EmissionsKg: 0.9,
          scope2EmissionsKg: 1.5,
          scope3EmissionsKg: Math.max(0.5, Number(formData.totalCarbonKg) - 2.4),
          svhcChemicalStatus: 'SVHC 240종 전수 검사 불검출 (< 0.01%)',
          tariffsCode: '6201.93.0000',
          customsDeclarationId: `KR-CUSTOMS-2026-DPP-${Math.floor(100000 + Math.random() * 900000)}`,
          smartContractAddress: '0x3D72aB41c9B4F8e310024976a264aD821Ce763F9',
          blockchainTxHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
          verifierSignature: `SIG_ED25519_KR_ECOLABEL_2026_${Math.floor(1000 + Math.random()*9000)}`,
          verifierOrg: '한국환경산업기술원(KEITI) & TÜV Rheinland',
          verificationTimestamp: new Date().toISOString()
        },
        // 원사/제직/염가공은 연동 원단에서 상속되고, 완제품은 봉제만 선언한다.
        domestic_origin: {
          is_domestic_sewing: formData.isDomesticSewing,
          processes: formData.sewingCompany.trim()
            ? {
                sewing: {
                  companyName: formData.sewingCompany.trim(),
                  location: formData.sewingLocation.trim() || undefined
                }
              }
            : undefined
        }
      };

      await savePassport(newPassport);
      await refresh();
      setFormData((prev) => ({ ...prev, product_name: '', image_url: '' }));
      setIsFormOpen(false);
      setSelectedQR(newPassport);
    } finally {
      setSaving(false);
    }
  };

  const selectedFabricObj = fabrics.find((f) => f.id === formData.selected_fabric_id);

  /** 저장 전에도 원단 상속 + 봉제 입력값으로 트랙을 실시간 판정한다. */
  // 목록 필터 — 선택지는 실제 등록된 데이터에서만 뽑는다(빈 선택지를 만들지 않는다).
  const brandOptions = useMemo(
    () => Array.from(new Set(passports.map((p) => p.brand_name).filter(Boolean))).sort(),
    [passports]
  );
  const seasonOptions = useMemo(
    () => Array.from(new Set(passports.map((p) => p.season).filter(Boolean))).sort(),
    [passports]
  );

  const filteredPassports = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    return passports.filter((p) => {
      if (listBrand && p.brand_name !== listBrand) return false;
      if (listSeason && p.season !== listSeason) return false;
      if (listFabricLink === 'linked' && !p.fabric_id) return false;
      if (listFabricLink === 'none' && p.fabric_id) return false;
      if (!q) return true;
      return [p.product_name, p.brand_name, p.id, p.fabric_id, p.category, p.season]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [passports, listQuery, listBrand, listSeason, listFabricLink]);

  const draftSummary = useMemo(
    () =>
      summarizeDomesticProcesses({
        subjectType: 'passport',
        fabric: selectedFabricObj ?? null,
        passport: {
          id: 'DRAFT',
          product_name: formData.product_name,
          brand_name: formData.brand_name,
          category: '',
          season: '',
          manufactured_country: formData.manufactured_country,
          image_url: '',
          fabric_id: formData.selected_fabric_id,
          fabric_snapshot: selectedFabricObj,
          materials_summary: selectedFabricObj?.composition ?? [],
          eco_scores: {
            overallScore: 0,
            carbonRating: 'A',
            totalCarbonKg: 0,
            durabilityIndex: 0,
            repairabilityScore: 0,
            recyclabilityRate: 0
          },
          care_instructions: [],
          circularity_guide: {
            repairOptions: '',
            takeBackProgram: '',
            recyclingGuideline: '',
            estimatedLifespanYears: 0
          },
          supply_chain_journey: [],
          deep_compliance_data: {
            lcaMethodology: '',
            scope1EmissionsKg: 0,
            scope2EmissionsKg: 0,
            scope3EmissionsKg: 0,
            svhcChemicalStatus: '',
            tariffsCode: '',
            customsDeclarationId: '',
            verifierSignature: '',
            verifierOrg: '',
            verificationTimestamp: ''
          },
          domestic_origin: { is_domestic_sewing: formData.isDomesticSewing }
        }
      }),
    [
      selectedFabricObj,
      formData.isDomesticSewing,
      formData.selected_fabric_id,
      formData.product_name,
      formData.brand_name,
      formData.manufactured_country
    ]
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Header currentRole="manufacturer" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* 상단 타이틀 & 등록 버튼 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <QrCode className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black text-white">패션 DPP 관리</h1>
            </div>
            <p className="text-xs text-slate-400">
              원단 공급망(Tier-2)을 연동하여 완제품 디지털 제품 여권 및 2D QR 라벨을 발급합니다.
            </p>
          </div>

          <button
            onClick={() => {
              if (!isFormOpen) {
                setFormData((prev) => ({ ...prev, product_name: '', image_url: '' }));
                if (fileInputRef.current) fileInputRef.current.value = '';
              }
              setIsFormOpen(!isFormOpen);
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
          >
            {isFormOpen ? '등록 폼 닫기' : <><Plus className="w-4 h-4" /> 신규 패션 DPP 등록</>}
          </button>
        </div>

        {/* 신규 DPP 등록 폼 (토글) */}
        {isFormOpen && (
          <form onSubmit={handleCreatePassport} className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/30 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  신규 패션 의류 DPP 등록 (EU ESPR 표준)
                </h3>
                <p className="text-xs text-slate-400">
                  원단 업체의 고유 ID를 연계하면 친환경 인증 및 소재 정보가 자동 상속됩니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 상품 기본 정보 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    상품명 *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 에코 써밋 3L 알파인 자켓"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="w-full glass-input px-4 py-2.5 rounded-xl text-xs placeholder-slate-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      브랜드/제조사
                    </label>
                    <input
                      type="text"
                      value={formData.brand_name}
                      onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                      className="w-full glass-input px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      카테고리 *
                    </label>
                    <select
                      value={selectedCategoryOption}
                      onChange={(e) => setSelectedCategoryOption(e.target.value)}
                      className="w-full glass-input px-3 py-2.5 rounded-xl text-xs bg-slate-950 font-medium text-white"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {selectedCategoryOption === '직접 입력' && (
                      <input
                        type="text"
                        placeholder="카테고리 직접 입력 (예: Outerwear, Accessories)"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full glass-input px-3 py-2 rounded-xl text-xs mt-2 placeholder-slate-500 animate-fadeIn"
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      시즌 *
                    </label>
                    <select
                      value={selectedSeasonOption}
                      onChange={(e) => setSelectedSeasonOption(e.target.value)}
                      className="w-full glass-input px-3 py-2.5 rounded-xl text-xs bg-slate-950 font-medium text-white"
                    >
                      {SEASON_OPTIONS.map((season) => (
                        <option key={season} value={season}>
                          {season}
                        </option>
                      ))}
                    </select>
                    {selectedSeasonOption === '직접 입력' && (
                      <input
                        type="text"
                        placeholder="시즌 직접 입력 (예: 2026 S/S Special)"
                        value={customSeason}
                        onChange={(e) => setCustomSeason(e.target.value)}
                        className="w-full glass-input px-3 py-2 rounded-xl text-xs mt-2 placeholder-slate-500 animate-fadeIn"
                        required
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      제조국
                    </label>
                    <input
                      type="text"
                      value={formData.manufactured_country}
                      onChange={(e) => setFormData({ ...formData, manufactured_country: e.target.value })}
                      className="w-full glass-input px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* 상품 이미지 업로드 영역 */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      대표 상품 이미지 *
                    </label>
                    <span className="text-[10px] text-slate-400">PNG, JPG, WebP 자동 최적화</span>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {formData.image_url ? (
                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formData.image_url}
                          alt="미리보기"
                          className="w-14 h-14 rounded-xl object-cover bg-slate-800 border border-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            이미지 등록 완료
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {isUploading ? '압축 처리 중...' : 'DPP 대표 썸네일 및 QR 상세 뷰에 표시됩니다'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                        >
                          사진 변경
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, image_url: '' }));
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="이미지 삭제"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/15 hover:border-emerald-400/50 rounded-2xl p-5 text-center cursor-pointer hover:bg-white/[0.02] transition-all group"
                    >
                      <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 mx-auto mb-2 transition-colors" />
                      <p className="text-xs font-bold text-white mb-1">
                        {isUploading ? '이미지 최적화 중...' : '클릭하여 내 PC에서 이미지 파일 업로드'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        스마트폰 사진, 룩북 사진을 드래그하거나 선택하세요 (권장: 가로세로 800px 이상)
                      </p>
                    </div>
                  )}

                  {/* 프리셋 추천 이미지 빠른 선택 바 */}
                  <div className="pt-1">
                    <span className="text-[11px] text-slate-400 block mb-1.5">💡 또는 샘플 이미지에서 빠른 선택:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_IMAGES.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url: preset.url })}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                            formData.image_url === preset.url
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/40'
                              : 'bg-slate-900 border border-white/10 text-slate-300 hover:bg-slate-800 hover:border-white/20'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preset.url}
                            alt=""
                            className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                          />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 핵심: 원단 고유 ID 연동 및 LCA 지표 */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Layers className="w-4 h-4" />
                      원단 공급사 고유 ID 연동 (Tier-2 Upstream)
                    </label>
                    <span className="text-[10px] text-slate-400">자동 검증</span>
                  </div>

                  <select
                    value={formData.selected_fabric_id}
                    onChange={(e) => setFormData({ ...formData, selected_fabric_id: e.target.value })}
                    className="w-full glass-input px-4 py-2.5 rounded-xl text-xs bg-slate-950 font-mono"
                  >
                    {fabrics.map((f) => (
                      <option key={f.id} value={f.id}>
                        [{f.id}] {f.name} ({f.supplier_name})
                      </option>
                    ))}
                  </select>

                  {/* 선택된 원단 프리뷰 */}
                  {selectedFabricObj && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-300 font-medium">
                        <span>공급업체:</span>
                        <span className="text-white font-bold">{selectedFabricObj.supplier_name}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>소재 혼용:</span>
                        <span className="text-emerald-400">
                          {selectedFabricObj.composition.map((c) => `${c.material} ${c.percentage}%`).join(', ')}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>원단 탄소발자국:</span>
                        <span className="text-sky-400">{selectedFabricObj.environmental_impact.carbonKgPerKg} kg CO₂e/kg</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>보유 인증:</span>
                        <span className="text-slate-200">{selectedFabricObj.certifications.map((c) => c.name).join(', ')}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 국산 공정 이력 — 상속된 원단 공정 + 봉제 공정 선언 */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/20 space-y-3">
                  <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <BadgeCheck className="w-4 h-4" />
                    국산 공정 이력
                  </label>

                  {/* 원단에서 상속 (읽기 전용) */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-white/5">
                    <p className="text-[10px] text-slate-500 font-bold mb-1.5">
                      연동 원단에서 상속된 공정 (읽기 전용)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(['yarn', 'weaving', 'dyeing'] as const).map((stage) => {
                        const v = draftSummary.processes[stage];
                        return (
                          <span
                            key={stage}
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              v === true
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : v === false
                                  ? 'bg-rose-500/15 text-rose-300'
                                  : 'bg-slate-700/40 text-slate-400'
                            }`}
                          >
                            {v === true ? (
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            ) : v === false ? (
                              <XCircle className="w-2.5 h-2.5" />
                            ) : (
                              <CircleHelp className="w-2.5 h-2.5" />
                            )}
                            {PROCESS_LABEL[stage]}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* 봉제 공정 (완제품이 선언) */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-200">
                        {PROCESS_LABEL.sewing} 공정 (완제품)
                      </span>
                      <div className="inline-flex rounded-lg border border-slate-700/60 overflow-hidden shrink-0">
                        {(
                          [
                            { v: true as TriState, label: '국내', active: 'bg-emerald-500 text-slate-950' },
                            { v: false as TriState, label: '국외', active: 'bg-rose-500 text-slate-950' },
                            { v: null as TriState, label: '미확인', active: 'bg-slate-600 text-slate-100' }
                          ]
                        ).map((opt) => (
                          <button
                            key={String(opt.v)}
                            type="button"
                            role="radio"
                            aria-checked={formData.isDomesticSewing === opt.v}
                            onClick={() => setFormData({ ...formData, isDomesticSewing: opt.v })}
                            className={`px-2 py-1 text-[10px] font-bold border-r border-slate-700/60 last:border-r-0 transition-all ${
                              formData.isDomesticSewing === opt.v
                                ? opt.active
                                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.sewingCompany}
                        onChange={(e) => setFormData({ ...formData, sewingCompany: e.target.value })}
                        placeholder="봉제 공장명"
                        className="glass-input px-2.5 py-1.5 rounded-lg text-[11px]"
                      />
                      <input
                        type="text"
                        value={formData.sewingLocation}
                        onChange={(e) => setFormData({ ...formData, sewingLocation: e.target.value })}
                        placeholder="소재지 (예: 부산광역시 강서구)"
                        className="glass-input px-2.5 py-1.5 rounded-lg text-[11px]"
                      />
                    </div>
                  </div>

                  {/* 입력 상태 요약 — 인증 판정이 아니라 '자료가 얼마나 채워졌는가'만 보여준다.
                      국산인증은 업체 단위라 이 제품에 트랙을 부여할 수 없다. */}
                  <div className="rounded-xl border border-slate-600/40 bg-slate-800/40 px-3 py-2.5 flex items-center gap-3">
                    <Factory className="w-4 h-4 text-emerald-300 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-slate-100">
                        국내 공정 {draftSummary.domesticCount} / {draftSummary.stages.length}
                        {draftSummary.domesticRatio !== null && (
                          <span className="ml-1.5 font-medium text-slate-400">
                            · 국산 소재 혼용률 {draftSummary.domesticRatio}%
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                        {!draftSummary.hasFabricLink && draftSummary.processes.weaving === null
                          ? '연결된 원단 DPP가 없어 제직·염가공 공정을 확인할 수 없습니다.'
                          : draftSummary.unknownCount > 0
                            ? `미확인 ${draftSummary.unknownCount}건 — 자료가 없는 공정은 국외로 기록되지 않습니다.`
                            : '모든 공정의 국내 생산 여부가 기록되었습니다.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      총 탄소배출 (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.totalCarbonKg}
                      onChange={(e) => setFormData({ ...formData, totalCarbonKg: Number(e.target.value) })}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      수리지수 (1-10)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      max="10"
                      value={formData.repairabilityScore}
                      onChange={(e) => setFormData({ ...formData, repairabilityScore: Number(e.target.value) })}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      재활용률 (%)
                    </label>
                    <input
                      type="number"
                      max="100"
                      value={formData.recyclabilityRate}
                      onChange={(e) => setFormData({ ...formData, recyclabilityRate: Number(e.target.value) })}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Save className="w-4 h-4" />
                {saving ? '발급 중...' : '완제품 DPP 발급 및 QR 생성'}
              </button>
            </div>
          </form>
        )}

        {/* 발급된 패션 완제품 DPP 목록 테이블/카드 */}
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shirt className="w-5 h-5 text-emerald-400" />
              발급된 DPP 목록 ({passports.length}건)
            </h3>
            <span className="text-xs text-slate-400">GS1 Digital Link URI 호환</span>
          </div>

          <ListToolbar
            query={listQuery}
            onQueryChange={setListQuery}
            placeholder="제품명, 브랜드, DPP ID, 연계 원단 ID로 검색"
            shown={filteredPassports.length}
            total={passports.length}
          >
            <FilterSelect
              label="브랜드"
              value={listBrand}
              onChange={setListBrand}
              options={[['', '브랜드 전체'], ...brandOptions.map((b) => [b, b] as [string, string])]}
            />
            <FilterSelect
              label="시즌"
              value={listSeason}
              onChange={setListSeason}
              options={[['', '시즌 전체'], ...seasonOptions.map((v) => [v, v] as [string, string])]}
            />
            <FilterPills
              label="원단 연동"
              value={listFabricLink}
              onChange={setListFabricLink}
              options={[
                ['', '전체'],
                ['linked', '원단 연동'],
                ['none', '자체 소재']
              ]}
            />
          </ListToolbar>

          {filteredPassports.length === 0 && passports.length > 0 && (
            <div className="text-center py-12 px-6">
              <p className="text-xs text-slate-400 font-semibold">조건에 맞는 제품이 없습니다.</p>
              <button
                onClick={() => {
                  setListQuery('');
                  setListBrand('');
                  setListSeason('');
                  setListFabricLink('');
                }}
                className="mt-3 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
              >
                필터 초기화
              </button>
            </div>
          )}

          <div className="divide-y divide-white/5">
            {filteredPassports.map((p) => (
              <div
                key={p.id}
                className="p-5 sm:p-6 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image_url}
                    alt={p.product_name}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-800 border border-white/10 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1631112213238-b1bafeaecff3?auto=format&fit=crop&w=1000&q=80';
                    }}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {p.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">{p.brand_name}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{p.product_name}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      연계 원단: <span className="font-mono text-sky-400">{p.fabric_id || '자체 소재'}</span> |{' '}
                      탄소: {p.eco_scores.totalCarbonKg} kg | 에코점수: {p.eco_scores.overallScore}점
                    </p>
                  </div>
                </div>

                {/* 인증마크는 제품이 아니라 업체에 발행된다(섬산련 규정: "인증서·확인서 및 마크를 발행",
                    발급 단위 천매/년). 따라서 제품 목록에서 마크를 발급하는 동선은 두지 않는다. */}
                <div className="flex flex-wrap items-center gap-2 self-end md:self-auto shrink-0">
                  <button
                    onClick={() => setSelectedQR(p)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    QR 라벨 인쇄
                  </button>
                  <button
                    onClick={() => router.push(`/p?id=${p.id}`)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    공개 뷰 확인
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QR 모달 */}
      {selectedQR && (
        <QRGeneratorModal
          passport={selectedQR}
          isOpen={true}
          onClose={() => setSelectedQR(null)}
        />
      )}
    </div>
  );
}
