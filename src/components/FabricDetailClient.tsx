'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { getFabricById, getPassports, getCertForCompany } from '@/lib/supabase';
import { FabricDPP, FashionDPP } from '@/types/dpp';
import type { DomesticCertification } from '@/types/domesticCert';
import { summarizeDomesticProcesses } from '@/lib/domesticCert';
import { DomesticProcessCard } from '@/components/cert/DomesticProcessCard';
import { Header } from '@/components/Header';
import { 
  Layers, 
  Award, 
  Leaf, 
  ShieldCheck, 
  ArrowLeft, 
  Share2, 
  Shirt, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export function FabricDetailClient({ fabricId: propFabricId }: { fabricId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  // 1. prop -> 2. searchParams (?id=...) -> 3. dynamic route params ([id]) -> 4. window.location pathname
  const rawId = propFabricId || 
    (searchParams ? searchParams.get('id') : null) || 
    (params?.id as string) || 
    (typeof window !== 'undefined' ? window.location.pathname.split('/fabric/')[1]?.split('?')[0] : '');

  const fabricId = typeof rawId === 'string' ? decodeURIComponent(rawId).trim() : '';

  const [fabric, setFabric] = useState<FabricDPP | null>(null);
  const [relatedPassports, setRelatedPassports] = useState<FashionDPP[]>([]);
  // 공급사(업체)의 국산인증. 원단에 붙는 것이 아니라 참고 정보로만 보여준다.
  const [supplierCert, setSupplierCert] = useState<DomesticCertification | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!fabricId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [fData, pData] = await Promise.all([getFabricById(fabricId), getPassports()]);
        // 국산인증은 업체에 발행되므로 원단 ID가 아니라 공급사로 조회한다.
        const cert = fData
          ? await getCertForCompany({
              companyId: fData.company_id,
              companyName: fData.supplier_name
            })
          : null;
        if (isMounted) {
          setFabric(fData);
          setRelatedPassports(pData.filter((p: FashionDPP) => p.fabric_id === fabricId));
          setSupplierCert(cert);
        }
      } catch (err) {
        console.error('[GoDPP] Load fabric detail failed:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [fabricId]);

  const processSummary = useMemo(
    () => (fabric ? summarizeDomesticProcesses({ subjectType: 'fabric', fabric }) : null),
    [fabric]
  );

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Sparkles className="w-8 h-8 text-purple-400 animate-spin mb-3" />
        <p className="text-sm font-medium">원단 DPP 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (!fabric) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Header />
        <div className="text-center max-w-md p-8 glass-panel rounded-2xl border border-white/10 mt-12">
          <Layers className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">원단 여권을 찾을 수 없습니다</h2>
          <p className="text-xs text-slate-400 mb-6">
            ID: <span className="font-mono text-purple-400">{fabricId || '미지정'}</span>에 해당하는 원단이 존재하지 않습니다.
          </p>
          <button
            onClick={() => router.push('/fabric-supplier')}
            className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs transition-all"
          >
            원단 목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Header currentRole="fabric_supplier" />

      {/* 상단 액션 바 */}
      <div className="border-b border-white/5 bg-slate-950/60 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <button
            onClick={() => router.push('/fabric-supplier')}
            className="text-slate-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            원단 목록
          </button>

          <button
            onClick={handleShare}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copied ? '복사 완료' : '원단 ID 복사'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-8">
        {/* 원단 히어로 카드 */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-purple-500/30 shadow-2xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              원단 ID: {fabric.id}
            </span>
            <span className="text-xs text-slate-400">
              공급사: <strong className="text-white">{fabric.supplier_name}</strong> ({fabric.supplier_country})
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            {fabric.name}
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed mb-6">
            EU CIRPASS 소재 표준 기반 원단 디지털 여권입니다. 원사 추적성, 화학물질 안전성,
            온실가스 원단위 배출량 및 재활용 함량이 공인 검증기관을 통해 인증되었습니다.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 block">원단 탄소 배출</span>
              <span className="text-lg font-bold text-purple-300">
                {fabric.environmental_impact.carbonKgPerKg} <span className="text-xs font-normal">kg/kg</span>
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 block">원단 중량 (GSM)</span>
              <span className="text-lg font-bold text-white">
                {fabric.weight_gsm} <span className="text-xs font-normal">g/m²</span>
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 block">재활용 함량</span>
              <span className="text-lg font-bold text-emerald-400">
                {fabric.environmental_impact.recycledContentPercentage}%
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 block">화학 안전성</span>
              <span className="text-lg font-bold text-sky-400">
                {fabric.compliance_data.pfasFree ? 'PFAS-Free' : 'Pass'}
              </span>
            </div>
          </div>
        </div>

        {/* 국산 공정 이력 (인증이 아니라 이 원단이 실제로 보유한 공정 데이터) */}
        {processSummary && (
          <DomesticProcessCard
            summary={processSummary}
            subjectType="fabric"
            processDetails={fabric.domestic_origin?.processes}
            manufacturerCert={supplierCert}
            manufacturerName={fabric.supplier_name}
          />
        )}

        {/* 소재 혼용률 및 조직 */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            원사 혼용률 및 직조/편직 사양
          </h3>

          <div className="space-y-3">
            {fabric.composition.map((c, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-200 font-semibold">{c.material}</span>
                  <span className="text-purple-300 font-mono font-bold">{c.percentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-400"
                    style={{ width: `${c.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {fabric.weaving_type && (
            <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 text-xs flex justify-between">
              <span className="text-slate-400">직조 조직 (Weaving Structure):</span>
              <span className="text-slate-200 font-medium">{fabric.weaving_type}</span>
            </div>
          )}
        </div>

        {/* 공인 친환경 인증서 목록 */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            공인 친환경 인증 및 유효성 검증
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fabric.certifications.map((cert, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{cert.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                    유효 (Valid)
                  </span>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>인증 번호: <span className="font-mono text-slate-200">{cert.id}</span></p>
                  <p>발급 기관: <span className="text-slate-200">{cert.issuer}</span></p>
                  <p>유효 기간: <span className="text-slate-200">{cert.validUntil}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 유해물질 불검출 & 시험 성적서 */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            유해물질 안전성 및 시험성적서 해시
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between">
              <span className="text-slate-300">PFAS 과불화화합물 영구 불검출 인증</span>
              <span className="font-bold text-emerald-400">
                {fabric.compliance_data.pfasFree ? '100% PFAS-Free 검증완료' : '일반'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between">
              <span className="text-slate-300">공인 시험연구원</span>
              <span className="text-slate-200">{fabric.compliance_data.testingLab}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
              <span className="text-slate-400 block text-[10px]">공인 성적서 무결성 암호화 해시 (SHA-256)</span>
              <span className="font-mono text-[11px] text-purple-300 break-all">
                {fabric.compliance_data.labReportHash}
              </span>
            </div>
          </div>
        </div>

        {/* 이 원단을 채택한 완제품(Fashion DPP) 역추적 */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shirt className="w-5 h-5 text-emerald-400" />
              이 원단을 채택한 완제품 DPP ({relatedPassports.length}건)
            </h3>
            <span className="text-xs text-slate-400">다운스트림 완제품 연계</span>
          </div>

          {relatedPassports.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              아직 이 원단을 연동하여 발급된 패션 완제품이 없습니다. 패션 제조사 콘솔에서 바로 연동할 수 있습니다.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedPassports.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/p?id=${p.id}`)}
                  className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer flex items-center gap-3 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image_url}
                    alt={p.product_name}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-800 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80';
                    }}
                  />
                  <div className="flex-1 truncate">
                    <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                      {p.product_name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">{p.id}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
