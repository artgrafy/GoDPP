'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { getFabrics, saveFabric } from '@/lib/supabase';
import { FabricDPP } from '@/types/dpp';
import { 
  Layers, 
  Plus, 
  Sparkles, 
  Award, 
  Leaf, 
  ShieldCheck, 
  Save, 
  ExternalLink, 
  ArrowRight,
  CheckCircle2,
  FileCheck
} from 'lucide-react';

export default function FabricSupplierPage() {
  const router = useRouter();
  const [fabrics, setFabrics] = useState<FabricDPP[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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
    cert_grs: true,
    cert_oeko: true,
    cert_bluesign: true,
    carbonKgPerKg: 3.2,
    waterLitersPerKg: 38.0,
    pfasFree: true,
    testingLab: 'SGS Eco-Textile Testing Lab Zurich'
  });

  useEffect(() => {
    async function load() {
      const data = await getFabrics();
      setFabrics(data);
    }
    load();
  }, []);

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

      const newFabric: FabricDPP = {
        id: newId,
        name: formData.name,
        supplier_name: formData.supplier_name,
        supplier_country: formData.supplier_country,
        composition: [
          { material: formData.material1, percentage: Number(formData.percentage1), isRecycled: true },
          ...(formData.percentage2 > 0 ? [{ material: formData.material2, percentage: Number(formData.percentage2) }] : [])
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
        }
      };

      await saveFabric(newFabric);
      const updated = await getFabrics();
      setFabrics(updated);
      setIsFormOpen(false);
      router.push(`/fabric/${newId}`);
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
              <h1 className="text-2xl font-black text-white">원단(소재) 공급사 DPP 관리 포털</h1>
            </div>
            <p className="text-xs text-slate-400">
              원단 단위 친환경 스펙, 공인 시험인증서 및 탄소발자국을 등록하여 고유 ID를 발급받습니다.
            </p>
          </div>

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all self-start sm:self-auto"
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
                  <span className="text-xs font-bold text-white block">소재 성분 및 혼용률</span>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={formData.material1}
                      onChange={(e) => setFormData({ ...formData, material1: e.target.value })}
                      className="col-span-2 glass-input px-3 py-2 rounded-xl text-xs"
                    />
                    <input
                      type="number"
                      value={formData.percentage1}
                      onChange={(e) => setFormData({ ...formData, percentage1: Number(e.target.value) })}
                      className="glass-input px-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={formData.material2}
                      onChange={(e) => setFormData({ ...formData, material2: e.target.value })}
                      className="col-span-2 glass-input px-3 py-2 rounded-xl text-xs"
                    />
                    <input
                      type="number"
                      value={formData.percentage2}
                      onChange={(e) => setFormData({ ...formData, percentage2: Number(e.target.value) })}
                      className="glass-input px-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 인증서 및 환경 지표 */}
              <div className="space-y-4">
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
                className="px-6 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
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

          <div className="divide-y divide-white/5">
            {fabrics.map((f) => (
              <div
                key={f.id}
                className="p-5 sm:p-6 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
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
                  <button
                    onClick={() => router.push(`/fabric/${f.id}`)}
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
