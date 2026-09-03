'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { getPassports, getFabrics, savePassport } from '@/lib/supabase';
import { FashionDPP, FabricDPP } from '@/types/dpp';
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
  Trash2,
  Save,
  ArrowRight
} from 'lucide-react';

export default function ManufacturerDashboard() {
  const router = useRouter();
  const [passports, setPassports] = useState<FashionDPP[]>([]);
  const [fabrics, setFabrics] = useState<FabricDPP[]>([]);
  const [selectedQR, setSelectedQR] = useState<FashionDPP | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    product_name: '',
    brand_name: 'ARCTERA Sustainability',
    category: 'Outerwear (기능성 아웃도어)',
    season: '2026 F/W Circular',
    manufactured_country: 'KR (대한민국)',
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
    selected_fabric_id: '',
    totalCarbonKg: 7.2,
    repairabilityScore: 9.0,
    recyclabilityRate: 90,
  });

  useEffect(() => {
    async function load() {
      const [p, f] = await Promise.all([getPassports(), getFabrics()]);
      setPassports(p);
      setFabrics(f);
      if (f.length > 0) {
        setFormData((prev) => ({ ...prev, selected_fabric_id: f[0].id }));
      }
    }
    load();
  }, []);

  const handleCreatePassport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_name) return;

    setSaving(true);
    try {
      const selectedFabric = fabrics.find((f) => f.id === formData.selected_fabric_id);
      const newId = `DPP-2026-${formData.category.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newPassport: FashionDPP = {
        id: newId,
        product_name: formData.product_name,
        brand_name: formData.brand_name,
        category: formData.category,
        season: formData.season,
        manufactured_country: formData.manufactured_country,
        image_url: formData.image_url,
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
            companyName: '아크테라 스마트 에코 팩토리',
            location: '부산광역시 강서구',
            country: 'KR',
            certifications: ['SA8000', 'ISO 14001'],
            processDate: '2026-03-01',
            verified: true
          }
        ],
        deep_compliance_data: {
          lcaMethodology: 'ISO 14040/44 Ecoinvent 3.9 (PEFCR)',
          scope1EmissionsKg: 0.9,
          scope2EmissionsKg: 1.5,
          scope3EmissionsKg: Number(formData.totalCarbonKg) - 2.4,
          svhcChemicalStatus: 'SVHC 240종 전수 검사 불검출 (< 0.01%)',
          tariffsCode: '6201.93.0000',
          customsDeclarationId: `KR-CUSTOMS-2026-DPP-${Math.floor(100000 + Math.random() * 900000)}`,
          smartContractAddress: '0x3D72aB41c9B4F8e310024976a264aD821Ce763F9',
          blockchainTxHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
          verifierSignature: `SIG_ED25519_KR_ECOLABEL_2026_${Math.floor(1000 + Math.random()*9000)}`,
          verifierOrg: '한국환경산업기술원(KEITI) & TÜV Rheinland',
          verificationTimestamp: new Date().toISOString()
        }
      };

      await savePassport(newPassport);
      const updated = await getPassports();
      setPassports(updated);
      setIsFormOpen(false);
      setSelectedQR(newPassport);
    } finally {
      setSaving(false);
    }
  };

  const selectedFabricObj = fabrics.find((f) => f.id === formData.selected_fabric_id);

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
              <h1 className="text-2xl font-black text-white">패션 제조사 DPP 관리 콘솔</h1>
            </div>
            <p className="text-xs text-slate-400">
              원단 공급망(Tier-2)을 연동하여 완제품 디지털 제품 여권 및 2D QR 라벨을 발급합니다.
            </p>
          </div>

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
          >
            {isFormOpen ? '등록 폼 닫기' : <><Plus className="w-4 h-4" /> 신규 패션 DPP 발급</>}
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
                      카테고리
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full glass-input px-4 py-2.5 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      시즌
                    </label>
                    <input
                      type="text"
                      value={formData.season}
                      onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                      className="w-full glass-input px-4 py-2.5 rounded-xl text-xs"
                    />
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

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    상품 이미지 URL
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full glass-input px-4 py-2.5 rounded-xl text-xs"
                  />
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

          <div className="divide-y divide-white/5">
            {passports.map((p) => (
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
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
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

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <button
                    onClick={() => setSelectedQR(p)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    QR 라벨 인쇄
                  </button>
                  <button
                    onClick={() => router.push(`/p/${p.id}`)}
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
