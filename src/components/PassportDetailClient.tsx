'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPassportById } from '@/lib/supabase';
import { FashionDPP } from '@/types/dpp';
import { Header } from '@/components/Header';
import { SupplyChainTimeline } from '@/components/SupplyChainTimeline';
import { LcaRadarChart } from '@/components/LcaRadarChart';
import { DeepDataModal } from '@/components/DeepDataModal';
import { QRGeneratorModal } from '@/components/QRGeneratorModal';
import { 
  Shirt, 
  Sparkles, 
  ShieldCheck, 
  Droplet, 
  Wind, 
  Wrench, 
  RefreshCw, 
  Layers, 
  ExternalLink, 
  QrCode, 
  ArrowLeft,
  Share2,
  CheckCircle2,
  Lock,
  Globe2
} from 'lucide-react';

export function PassportDetailClient({ passportId }: { passportId: string }) {
  const router = useRouter();
  const [passport, setPassport] = useState<FashionDPP | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeepDataOpen, setIsDeepDataOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadPassport() {
      if (!passportId) return;
      setLoading(false);
      const data = await getPassportById(passportId);
      setPassport(data);
    }
    loadPassport();
  }, [passportId]);

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
        <Sparkles className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-sm font-medium">디지털 제품 여권 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Header />
        <div className="text-center max-w-md p-8 glass-panel rounded-2xl border border-white/10 mt-12">
          <Shirt className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">여권을 찾을 수 없습니다</h2>
          <p className="text-xs text-slate-400 mb-6">
            ID: <span className="font-mono text-emerald-400">{passportId}</span>에 해당하는 DPP가 존재하지 않습니다.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Header />

      {/* 상단 네비게이션 & 빠른 액션 바 */}
      <div className="border-b border-white/5 bg-slate-950/60 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <button
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            목록으로
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? '복사 완료' : '공유'}
            </button>
            <button
              onClick={() => setIsQROpen(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              QR 라벨
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-8">
        {/* 1. 메인 히어로 카드 (소비자 친화적 디자인) */}
        <div className="glass-panel-emerald rounded-3xl p-6 sm:p-8 border border-emerald-500/20 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            {/* 상품 이미지 */}
            <div className="w-full sm:w-56 h-64 rounded-2xl overflow-hidden bg-slate-900 relative shrink-0 shadow-lg border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={passport.image_url}
                alt={passport.product_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md text-[10px] font-mono text-emerald-300 border border-emerald-500/30 text-center">
                DPP ID: {passport.id}
              </div>
            </div>

            {/* 상품 개요 */}
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {passport.brand_name}
                </span>
                <span className="text-xs text-slate-400 font-medium">{passport.season}</span>
                <span className="text-xs text-slate-400">• 제조국: {passport.manufactured_country}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {passport.product_name}
              </h1>

              <p className="text-xs text-slate-300 leading-relaxed">
                EU 에코디자인 규정(ESPR)에 따라 공식 발급된 디지털 제품 여권입니다. 원단 소재부터 공급망,
                탄소배출량 및 분해·재활용 지침을 투명하게 확인하실 수 있습니다.
              </p>

              {/* 핵심 에코 스코어 요약 박스 */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-emerald-500/20 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block">종합 에코스코어</span>
                  <span className="text-xl font-black text-emerald-400">{passport.eco_scores.overallScore}점</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-emerald-500/20 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block">탄소배출량</span>
                  <span className="text-xl font-black text-emerald-300">{passport.eco_scores.totalCarbonKg} kg</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-emerald-500/20 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block">재활용률</span>
                  <span className="text-xl font-black text-sky-400">{passport.eco_scores.recyclabilityRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 심층 데이터 감사 안내 배너 (국가/인증기관/제조사용) */}
        <div className="p-4 rounded-2xl glass-panel-blue border border-sky-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">국가 규제당국 & 공인 인증기관 심층 데이터 조회</h4>
              <p className="text-[11px] text-slate-300">
                세관 통관 HS코드, Scope 1·2·3 상세 LCA 원장, REACH SVHC 유해물질 시험성적서 열람
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDeepDataOpen(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-lg shadow-sky-500/20"
          >
            <Lock className="w-3.5 h-3.5" />
            심층 감사 데이터 열람
          </button>
        </div>

        {/* 3. 소재 구성 및 연계 원단 (Material & Fabric) */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              소재 구성 및 연동 원단 (Material Composition)
            </h3>
            {passport.fabric_snapshot && (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                원단 ID: {passport.fabric_snapshot.id}
              </span>
            )}
          </div>

          {/* 혼용률 바 차트 */}
          <div className="space-y-3">
            {passport.materials_summary.map((mat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-200 font-medium flex items-center gap-1.5">
                    {mat.isRecycled && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-400">
                        RECYCLED
                      </span>
                    )}
                    {mat.isOrganic && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-sky-500/20 text-sky-400">
                        ORGANIC
                      </span>
                    )}
                    {mat.material}
                  </span>
                  <span className="font-bold text-emerald-400 font-mono">{mat.percentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{ width: `${mat.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* 연계 원단 상세 카드 링크 */}
          {passport.fabric_snapshot && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">연계 원단 공급사</span>
                <h4 className="text-xs font-bold text-white">
                  {passport.fabric_snapshot.name} ({passport.fabric_snapshot.supplier_name})
                </h4>
              </div>
              <button
                onClick={() => router.push(`/fabric/${passport.fabric_snapshot?.id}`)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                원단 DPP 인증서 확인
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 4. 전과정평가(LCA) 환경성 지표 시각화 */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            지속가능성 & 전과정평가(LCA) 지표
          </h3>
          <LcaRadarChart
            ecoScores={passport.eco_scores}
            deepData={passport.deep_compliance_data}
          />
        </div>

        {/* 5. 공급망 여정 추적 (Supply Chain) */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10">
          <SupplyChainTimeline
            steps={passport.supply_chain_journey}
            fabricId={passport.fabric_id}
          />
        </div>

        {/* 6. 세탁/관리 & 순환경제 지침 (Care & Circularity) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 세탁 및 수명 연장 팁 */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Droplet className="w-5 h-5 text-sky-400" />
              세탁 및 케어 가이드 (의류 수명 연장)
            </h3>
            <div className="space-y-3">
              {passport.care_instructions.map((care, cIdx) => (
                <div key={cIdx} className="p-3 rounded-xl bg-slate-900/70 border border-white/5 space-y-1">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {care.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed pl-5">
                    {care.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 순환경제 및 수리/재활용 지침 */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-400" />
              순환경제 (수리 · 중고보상 · 재활용)
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/70 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-amber-400" />
                  수리 및 AS 옵션
                </span>
                <p className="text-slate-200 mt-1 text-[11px]">
                  {passport.circularity_guide.repairOptions}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/70 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-emerald-400" />
                  테이크백(중고 수거) 프로그램
                </span>
                <p className="text-slate-200 mt-1 text-[11px]">
                  {passport.circularity_guide.takeBackProgram}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/70 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                  <Globe2 className="w-3 h-3 text-sky-400" />
                  100% 자원순환 분해 지침
                </span>
                <p className="text-slate-200 mt-1 text-[11px]">
                  {passport.circularity_guide.recyclingGuideline}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 심층 데이터 모달 */}
      <DeepDataModal
        isOpen={isDeepDataOpen}
        onClose={() => setIsDeepDataOpen(false)}
        passportId={passport.id}
        productName={passport.product_name}
        deepData={passport.deep_compliance_data}
      />

      {/* QR 라벨 모달 */}
      <QRGeneratorModal
        passport={passport}
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
      />
    </div>
  );
}
