'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { FilterPills, FilterSelect, ListToolbar } from '@/components/ListToolbar';
import { getFabrics, saveFabric, findOrCreateCompany } from '@/lib/supabase';
import { FabricDPP } from '@/types/dpp';
import type { ProcessKey, TriState } from '@/types/domesticCert';
import { PROCESS_LABEL, summarizeDomesticProcesses } from '@/lib/domesticCert';
import {
  Layers,
  Plus,
  Sparkles,
  Award,
  Save,
  ArrowRight,
  AlertTriangle,
  BadgeCheck,
  Factory
} from 'lucide-react';

const DOMESTIC_STAGES: ProcessKey[] = ['yarn', 'weaving', 'dyeing'];

/** 3-state 라디오. 기본값은 '미확인' — 미입력을 '국외'로 기록하거나 '국내'를 기본 선택하면 안 된다. */
function TriStateRadio({
  value,
  onChange,
  name
}: {
  value: TriState;
  onChange: (v: TriState) => void;
  name: string;
}) {
  const options: Array<{ v: TriState; label: string; active: string }> = [
    { v: true, label: '국내', active: 'bg-emerald-500 text-slate-950 border-emerald-500' },
    { v: false, label: '국외', active: 'bg-rose-500 text-slate-950 border-rose-500' },
    { v: null, label: '미확인', active: 'bg-slate-600 text-slate-100 border-slate-600' }
  ];
  return (
    <div
      className="inline-flex rounded-lg border border-slate-700/60 overflow-hidden shrink-0"
      role="radiogroup"
      aria-label={name}
    >
      {options.map((opt) => (
        <button
          key={String(opt.v)}
          type="button"
          role="radio"
          aria-checked={value === opt.v}
          onClick={() => onChange(opt.v)}
          className={`px-2 py-1 text-[10px] font-bold transition-all border-r border-slate-700/60 last:border-r-0 ${
            value === opt.v ? opt.active : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function FabricSupplierPage() {
  const router = useRouter();
  const [fabrics, setFabrics] = useState<FabricDPP[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // 목록 필터
  const [listQuery, setListQuery] = useState('');
  const [listSupplier, setListSupplier] = useState('');
  const [listCert, setListCert] = useState('');
  const [listPfas, setListPfas] = useState('');

  // 신규 원단 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    supplier_name: '(주)에코텍스틸 테크놀로지 코리아',
    supplier_country: 'KR',
    weight_gsm: 140,
    weaving_type: '2-Layer Ripstop Elastic Weave',
    material1: 'Recycled Ocean Nylon',
    percentage1: 80,
    material2: 'Spandex / Polyurethane',
    percentage2: 20,
    material1Domestic: false,
    material2Domestic: false,
    cert_grs: true,
    cert_oeko: true,
    cert_bluesign: true,
    carbonKgPerKg: 3.2,
    waterLitersPerKg: 38.0,
    pfasFree: true,
    testingLab: 'SGS Eco-Textile Testing Lab Zurich'
  });

  // 국산 공정 이력 — 기본값은 전부 '미확인'
  const [domesticFlags, setDomesticFlags] = useState<Record<ProcessKey, TriState>>({
    yarn: null,
    weaving: null,
    dyeing: null,
    sewing: null
  });
  const [processCompanies, setProcessCompanies] = useState<Record<string, string>>({
    yarn: '',
    weaving: '',
    dyeing: ''
  });

  async function refresh() {
    const data = await getFabrics();
    setFabrics(data);
  }

  useEffect(() => {
    refresh();
  }, []);

  /** 저장 전에도 폼 입력값만으로 트랙을 실시간 판정한다. */
  // 목록 필터 — 선택지는 실제 등록된 데이터에서만 뽑는다(빈 선택지를 만들지 않는다).
  const supplierOptions = useMemo(
    () => Array.from(new Set(fabrics.map((f) => f.supplier_name).filter(Boolean))).sort(),
    [fabrics]
  );
  const certOptions = useMemo(
    () =>
      Array.from(
        new Set(fabrics.flatMap((f) => (f.certifications ?? []).map((c) => c.name)).filter(Boolean))
      ).sort(),
    [fabrics]
  );

  const filteredFabrics = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    return fabrics.filter((f) => {
      if (listSupplier && f.supplier_name !== listSupplier) return false;
      if (listCert && !(f.certifications ?? []).some((c) => c.name === listCert)) return false;
      if (listPfas === 'yes' && !f.compliance_data?.pfasFree) return false;
      if (!q) return true;
      return [
        f.name,
        f.supplier_name,
        f.id,
        f.weaving_type,
        ...(f.composition ?? []).map((c) => c.material)
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [fabrics, listQuery, listSupplier, listCert, listPfas]);

  const draftSummary = useMemo(
    () =>
      summarizeDomesticProcesses({
        subjectType: 'fabric',
        fabric: {
          id: 'DRAFT',
          name: formData.name,
          supplier_name: formData.supplier_name,
          supplier_country: formData.supplier_country,
          composition: [
            {
              material: formData.material1,
              percentage: Number(formData.percentage1),
              isDomestic: formData.material1Domestic
            },
            ...(formData.percentage2 > 0
              ? [
                  {
                    material: formData.material2,
                    percentage: Number(formData.percentage2),
                    isDomestic: formData.material2Domestic
                  }
                ]
              : [])
          ],
          weight_gsm: Number(formData.weight_gsm),
          certifications: [],
          environmental_impact: {
            carbonKgPerKg: 0,
            waterLitersPerKg: 0,
            energyMjPerKg: 0,
            recycledContentPercentage: 0,
            hazardousChemicals: 'Zero Detected'
          },
          compliance_data: {
            pfasFree: formData.pfasFree,
            oekoTexStandard: '',
            reachCompliant: true,
            labReportHash: '',
            labReportDate: '',
            testingLab: formData.testingLab
          },
          domestic_origin: {
            is_domestic_yarn: domesticFlags.yarn,
            is_domestic_weaving: domesticFlags.weaving,
            is_domestic_dyeing: domesticFlags.dyeing
          }
        }
      }),
    [formData, domesticFlags]
  );

  const handleCreateFabric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setSaving(true);
    try {
      const newId = `FAB-2026-${formData.pfasFree ? 'ECO' : 'TEX'}-${Math.floor(1000 + Math.random() * 9000)}`;

      const certs = [];
      if (formData.cert_grs) {
        certs.push({
          name: 'Global Recycled Standard (GRS 4.0)',
          id: `CU-${Math.floor(100000 + Math.random() * 900000)}-GRS`,
          issuer: 'Control Union',
          validUntil: '2027-12-31',
          status: 'valid' as const
        });
      }
      if (formData.cert_oeko) {
        certs.push({
          name: 'OEKO-TEX® Standard 100 Class I',
          id: `TESTEX-OEKO-${Math.floor(10000 + Math.random() * 90000)}`,
          issuer: 'OEKO-TEX Association',
          validUntil: '2027-08-31',
          status: 'valid' as const
        });
      }
      if (formData.cert_bluesign) {
        certs.push({
          name: 'bluesign® APPROVED',
          id: `BS-KR-${Math.floor(10000 + Math.random() * 90000)}`,
          issuer: 'bluesign technologies ag',
          validUntil: '2028-01-15',
          status: 'valid' as const
        });
      }

      // 공급업체를 업체 마스터에 연결한다(없으면 생성). supplier_name 은 표기 스냅샷으로 남는다.
      const master = await findOrCreateCompany({
        name: formData.supplier_name,
        role: 'fabric_supplier'
      });

      const newFabric: FabricDPP = {
        id: newId,
        company_id: master.id,
        name: formData.name,
        supplier_name: formData.supplier_name,
        supplier_country: formData.supplier_country,
        composition: [
          {
            material: formData.material1,
            percentage: Number(formData.percentage1),
            isRecycled: true,
            isDomestic: formData.material1Domestic
          },
          ...(formData.percentage2 > 0
            ? [
                {
                  material: formData.material2,
                  percentage: Number(formData.percentage2),
                  isDomestic: formData.material2Domestic
                }
              ]
            : [])
        ],
        weight_gsm: Number(formData.weight_gsm),
        weaving_type: formData.weaving_type,
        certifications: certs,
        environmental_impact: {
          carbonKgPerKg: Number(formData.carbonKgPerKg),
          waterLitersPerKg: Number(formData.waterLitersPerKg),
          energyMjPerKg: 52.0,
          recycledContentPercentage: Number(formData.percentage1),
          hazardousChemicals: 'Zero Detected'
        },
        compliance_data: {
          pfasFree: formData.pfasFree,
          oekoTexStandard: 'Class I Certified (Infant Grade)',
          reachCompliant: true,
          labReportHash: '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join(''),
          labReportDate: new Date().toISOString().split('T')[0],
          testingLab: formData.testingLab
        },
        domestic_origin: {
          is_domestic_yarn: domesticFlags.yarn,
          is_domestic_weaving: domesticFlags.weaving,
          is_domestic_dyeing: domesticFlags.dyeing,
          processes: {
            ...(processCompanies.yarn ? { yarn: { companyName: processCompanies.yarn } } : {}),
            ...(processCompanies.weaving
              ? { weaving: { companyName: processCompanies.weaving } }
              : {}),
            ...(processCompanies.dyeing ? { dyeing: { companyName: processCompanies.dyeing } } : {})
          }
        }
      };

      await saveFabric(newFabric);
      await refresh();
      setIsFormOpen(false);
      router.push(`/fabric?id=${newId}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Header currentRole="fabric_supplier" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Layers className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black text-white">원단 DPP 관리</h1>
            </div>
            <p className="text-xs text-slate-400">
              원단 단위 친환경 스펙, 공인 시험인증서 및 탄소발자국을 등록하여 고유 ID를 발급받습니다.
            </p>
          </div>

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all self-start sm:self-auto"
          >
            {isFormOpen ? '등록 폼 닫기' : <><Plus className="w-4 h-4" /> 신규 원단 DPP 등록</>}
          </button>
        </div>

        {/* 신규 원단 등록 폼 (토글) */}
        {isFormOpen && (
          <form onSubmit={handleCreateFabric} className="glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/30 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  신규 친환경 원단 DPP 발급 신청
                </h3>
                <p className="text-xs text-slate-400">
                  발급된 원단 ID는 패션 제조사가 완제품 DPP를 생성할 때 공급망 상속 키로 사용됩니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 원단 기본 사양 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    원단 품명 *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 100% GRS 리사이클 립스탑 나일론 3L"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full glass-input px-4 py-2.5 rounded-xl text-xs placeholder-slate-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      공급업체명
                    </label>
                    <input
                      type="text"
                      value={formData.supplier_name}
                      onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                      className="w-full glass-input px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      국가
                    </label>
                    <input
                      type="text"
                      value={formData.supplier_country}
                      onChange={(e) => setFormData({ ...formData, supplier_country: e.target.value })}
                      className="w-full glass-input px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      중량 (GSM g/m²)
                    </label>
                    <input
                      type="number"
                      value={formData.weight_gsm}
                      onChange={(e) => setFormData({ ...formData, weight_gsm: Number(e.target.value) })}
                      className="w-full glass-input px-4 py-2.5 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      조직/구조
                    </label>
                    <input
                      type="text"
                      value={formData.weaving_type}
                      onChange={(e) => setFormData({ ...formData, weaving_type: e.target.value })}
                      className="w-full glass-input px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* 혼용률 */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/5 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-white">소재 성분 및 혼용률</span>
                    <span className="text-[10px] text-slate-500">국산 체크 = 혼용률 산출 근거</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                    <input
                      type="text"
                      value={formData.material1}
                      onChange={(e) => setFormData({ ...formData, material1: e.target.value })}
                      className="glass-input px-3 py-2 rounded-xl text-xs"
                    />
                    <input
                      type="number"
                      value={formData.percentage1}
                      onChange={(e) => setFormData({ ...formData, percentage1: Number(e.target.value) })}
                      className="glass-input px-3 py-2 rounded-xl text-xs font-mono w-16"
                    />
                    <label className="flex items-center gap-1 text-[10px] text-slate-300 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={formData.material1Domestic}
                        onChange={(e) =>
                          setFormData({ ...formData, material1Domestic: e.target.checked })
                        }
                        className="w-3.5 h-3.5 accent-purple-500"
                      />
                      국산
                    </label>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                    <input
                      type="text"
                      value={formData.material2}
                      onChange={(e) => setFormData({ ...formData, material2: e.target.value })}
                      className="glass-input px-3 py-2 rounded-xl text-xs"
                    />
                    <input
                      type="number"
                      value={formData.percentage2}
                      onChange={(e) => setFormData({ ...formData, percentage2: Number(e.target.value) })}
                      className="glass-input px-3 py-2 rounded-xl text-xs font-mono w-16"
                    />
                    <label className="flex items-center gap-1 text-[10px] text-slate-300 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={formData.material2Domestic}
                        onChange={(e) =>
                          setFormData({ ...formData, material2Domestic: e.target.checked })
                        }
                        className="w-3.5 h-3.5 accent-purple-500"
                      />
                      국산
                    </label>
                  </div>
                  {Math.abs(
                    Number(formData.percentage1) + Number(formData.percentage2) - 100
                  ) > 0.5 && (
                    <p className="text-[10px] text-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      혼용률 합계가 {Number(formData.percentage1) + Number(formData.percentage2)}%
                      입니다. 국산 혼용률은 실제 합계로 정규화해 산출됩니다.
                    </p>
                  )}
                </div>
              </div>

              {/* 인증서 및 환경 지표 */}
              <div className="space-y-4">
                {/* 국산 공정 이력 (섬산련 국산 섬유제품 인증 대응) */}
                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/25 space-y-3">
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <BadgeCheck className="w-4 h-4 text-purple-400" />
                      국산 공정 이력 (섬산련 국산 섬유제품 인증 대응)
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      확인되지 않은 공정은 <strong>미확인</strong>으로 두세요. 미입력은 국외가 아닙니다.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {DOMESTIC_STAGES.map((stage) => (
                      <div key={stage} className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-semibold text-slate-200 block">
                            {PROCESS_LABEL[stage]}
                          </span>
                          <input
                            type="text"
                            value={processCompanies[stage] ?? ''}
                            onChange={(e) =>
                              setProcessCompanies({ ...processCompanies, [stage]: e.target.value })
                            }
                            placeholder="수행 업체명 (선택)"
                            className="w-full glass-input px-2 py-1 rounded-lg text-[10px] mt-0.5"
                          />
                        </div>
                        <TriStateRadio
                          name={PROCESS_LABEL[stage]}
                          value={domesticFlags[stage]}
                          onChange={(v) => setDomesticFlags({ ...domesticFlags, [stage]: v })}
                        />
                      </div>
                    ))}
                  </div>

                  {/* 입력 상태 요약 — 인증 판정이 아니라 '자료가 얼마나 채워졌는가'만 보여준다.
                      국산인증은 업체 단위라 이 원단에 트랙을 부여할 수 없다. */}
                  <div className="rounded-xl border border-slate-600/40 bg-slate-800/40 px-3 py-2.5 flex items-center gap-3">
                    <Factory className="w-4 h-4 text-purple-300 shrink-0" />
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
                        {draftSummary.unknownCount > 0
                          ? `미확인 ${draftSummary.unknownCount}건 — 자료가 없는 공정은 국외로 기록되지 않습니다.`
                          : '모든 공정의 국내 생산 여부가 기록되었습니다.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 인증서 체크박스 */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/5 space-y-3">
                  <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-400" />
                    보유 공인 친환경 인증서
                  </span>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.cert_grs}
                        onChange={(e) => setFormData({ ...formData, cert_grs: e.target.checked })}
                        className="rounded border-slate-700 text-purple-500 focus:ring-purple-400"
                      />
                      <span>Global Recycled Standard (GRS 4.0) 리사이클 인증</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.cert_oeko}
                        onChange={(e) => setFormData({ ...formData, cert_oeko: e.target.checked })}
                        className="rounded border-slate-700 text-purple-500 focus:ring-purple-400"
                      />
                      <span>OEKO-TEX® Standard 100 유해물질 안전 인증</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.cert_bluesign}
                        onChange={(e) => setFormData({ ...formData, cert_bluesign: e.target.checked })}
                        className="rounded border-slate-700 text-purple-500 focus:ring-purple-400"
                      />
                      <span>bluesign® APPROVED 친환경 생산 공정 인증</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      원단 탄소배출 (kg CO₂e/kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.carbonKgPerKg}
                      onChange={(e) => setFormData({ ...formData, carbonKgPerKg: Number(e.target.value) })}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      물 소비량 (L/kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.waterLitersPerKg}
                      onChange={(e) => setFormData({ ...formData, waterLitersPerKg: Number(e.target.value) })}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-2">
                  <label className="flex items-center gap-2 text-xs text-purple-200 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.pfasFree}
                      onChange={(e) => setFormData({ ...formData, pfasFree: e.target.checked })}
                      className="rounded border-purple-700 text-purple-500 focus:ring-purple-400"
                    />
                    <span>🛡️ PFAS-Free 영구 비불소계 친환경 발수 코팅 보증</span>
                  </label>
                  <p className="text-[11px] text-slate-400 pl-5">
                    시험 기관: {formData.testingLab}
                  </p>
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
                className="px-6 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
              >
                <Save className="w-4 h-4" />
                {saving ? '발급 중...' : '원단 DPP 발급 및 ID 생성'}
              </button>
            </div>
          </form>
        )}

        {/* 등록된 원단 목록 */}
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              발급된 원단 소재 목록 ({fabrics.length}종)
            </h3>
            <span className="text-xs text-slate-400">Upstream DPP Identifier</span>
          </div>

          <ListToolbar
            query={listQuery}
            onQueryChange={setListQuery}
            placeholder="원단명, 공급사, 원단 ID, 소재명으로 검색"
            shown={filteredFabrics.length}
            total={fabrics.length}
            unit="종"
            accent="purple"
          >
            <FilterSelect
              label="공급사"
              accent="purple"
              value={listSupplier}
              onChange={setListSupplier}
              options={[['', '공급사 전체'], ...supplierOptions.map((v) => [v, v] as [string, string])]}
            />
            <FilterSelect
              label="보유 인증"
              accent="purple"
              value={listCert}
              onChange={setListCert}
              options={[['', '인증 전체'], ...certOptions.map((v) => [v, v] as [string, string])]}
            />
            <FilterPills
              label="PFAS-Free"
              accent="purple"
              value={listPfas}
              onChange={setListPfas}
              options={[
                ['', '전체'],
                ['yes', 'PFAS-Free']
              ]}
            />
          </ListToolbar>

          {filteredFabrics.length === 0 && fabrics.length > 0 && (
            <div className="text-center py-12 px-6">
              <p className="text-xs text-slate-400 font-semibold">조건에 맞는 원단이 없습니다.</p>
              <button
                onClick={() => {
                  setListQuery('');
                  setListSupplier('');
                  setListCert('');
                  setListPfas('');
                }}
                className="mt-3 text-[11px] font-bold text-purple-400 hover:text-purple-300"
              >
                필터 초기화
              </button>
            </div>
          )}

          <div className="divide-y divide-white/5">
            {filteredFabrics.map((f) => (
              <div
                key={f.id}
                className="p-5 sm:p-6 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30">
                      {f.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {f.supplier_name} ({f.supplier_country})
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-2">{f.name}</h4>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>혼용률: {f.composition.map((c) => `${c.material} ${c.percentage}%`).join(', ')}</span>
                    <span>•</span>
                    <span>탄소: {f.environmental_impact.carbonKgPerKg} kg CO₂e/kg</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">
                      {f.compliance_data.pfasFree ? 'PFAS-Free ✓' : '일반'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  {/* 인증마크는 업체에 발행되는 것이므로 원단 목록에서 발급하지 않는다. */}
                  <button
                    onClick={() => router.push(`/fabric?id=${f.id}`)}
                    className="px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    원단 DPP 상세 명세서
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
