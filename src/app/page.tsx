'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { getPassports, getFabrics } from '@/lib/supabase';
import { FashionDPP, FabricDPP } from '@/types/dpp';
import { QRGeneratorModal } from '@/components/QRGeneratorModal';
import { 
  Shirt, 
  Layers, 
  QrCode, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Leaf, 
  CheckCircle2, 
  Building2, 
  FileText,
  Activity,
  Globe2
} from 'lucide-react';

export default function HomePage() {
  const [passports, setPassports] = useState<FashionDPP[]>([]);
  const [fabrics, setFabrics] = useState<FabricDPP[]>([]);
  const [selectedPassportForQR, setSelectedPassportForQR] = useState<FashionDPP | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pData, fData] = await Promise.all([getPassports(), getFabrics()]);
        setPassports(pData);
        setFabrics(fData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-sky-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>EU ESPR 규제 대응 · 순환경제 전과정 추적 플랫폼</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight mb-6">
              패션과 원단을 잇는 <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                디지털 제품 여권 (DPP)
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8">
              원단 공급사(Tier-2)의 친환경 소재 스펙과 인증부터 패션 제조사의 완제품 DPP 발급,
              그리고 소비자의 스마트폰 QR 스캔 및 국가 기관 심층 감사까지 원스톱으로 지원합니다.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/p/DPP-2026-JKT-0042"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
              >
                <Shirt className="w-4 h-4" />
                소비자 QR 뷰 데모 체험
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/manufacturer"
                className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-white font-bold text-sm flex items-center gap-2 transition-all"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                패션 제조사 콘솔
              </Link>
              <Link
                href="/fabric-supplier"
                className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-white font-bold text-sm flex items-center gap-2 transition-all"
              >
                <Layers className="w-4 h-4 text-sky-400" />
                원단 업체 포털
              </Link>
            </div>
          </div>

          {/* 4대 주요 역할 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {/* 1. 패션 제조사 */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-emerald-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">1. 패션 제조사</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  원단 고유 ID 연동, 탄소발자국/소재 스펙 입력, 완제품 고유 DPP 발급 및 인쇄용 2D QR 라벨 생성
                </p>
              </div>
              <Link
                href="/manufacturer"
                className="text-xs font-bold text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all pt-3 border-t border-white/5"
              >
                제조사 콘솔 바로가기 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 2. 일반 소비자 */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-sky-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-110 transition-transform">
                  <Shirt className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">2. 일반 소비자</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  카메라로 QR 스캔 시 친환경 에코스코어, 친환경 소재 구성, 세탁/수명 연장 가이드 및 순환경제 팁 확인
                </p>
              </div>
              <Link
                href="/p/DPP-2026-JKT-0042"
                className="text-xs font-bold text-sky-400 flex items-center gap-1 group-hover:gap-2 transition-all pt-3 border-t border-white/5"
              >
                소비자 랜딩 바로가기 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 3. 원단 공급사 */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-purple-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">3. 원단 업체</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  소재 혼용률, OEKO-TEX/GRS 친환경 인증서 등록, 고유 원단 식별자(FAB ID) 발급 및 공급망 추적
                </p>
              </div>
              <Link
                href="/fabric-supplier"
                className="text-xs font-bold text-purple-400 flex items-center gap-1 group-hover:gap-2 transition-all pt-3 border-t border-white/5"
              >
                원단 포털 바로가기 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 4. 국가 및 검증기관 */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-amber-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">4. 국가·검증기관</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  승인 계정 기반 세관 통관 HS코드, Scope 1/2/3 상세 LCA 원장, SVHC 유해물질 불검출 시험성적서 심층 감사
                </p>
              </div>
              <Link
                href="/verifier"
                className="text-xs font-bold text-amber-400 flex items-center gap-1 group-hover:gap-2 transition-all pt-3 border-t border-white/5"
              >
                규제 감사 포털 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 등록된 패션 완제품 DPP 목록 */}
      <section className="py-12 bg-slate-900/40 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Shirt className="w-6 h-6 text-emerald-400" />
                발급된 패션 완제품 여권 (Fashion DPPs)
              </h2>
              <p className="text-xs text-slate-400">
                실제 QR 스캔 또는 상세 보기를 통해 소비자와 인증기관 뷰를 체험할 수 있습니다.
              </p>
            </div>

            <Link
              href="/manufacturer"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto transition-all"
            >
              <QrCode className="w-4 h-4" />
              신규 의류 DPP 등록
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {passports.map((passport) => (
              <div
                key={passport.id}
                className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row gap-5 group"
              >
                {/* 상품 이미지 */}
                <div className="w-full sm:w-44 h-48 rounded-xl overflow-hidden bg-slate-800 relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={passport.image_url}
                    alt={passport.product_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    에코스코어 {passport.eco_scores.overallScore}점
                  </div>
                </div>

                {/* 정보 */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                        {passport.brand_name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                        {passport.id}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-2 line-clamp-1">
                      {passport.product_name}
                    </h3>

                    <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                      소재: {passport.materials_summary.map((m) => `${m.material} ${m.percentage}%`).join(', ')}
                    </p>

                    {passport.fabric_snapshot && (
                      <div className="p-2 rounded-lg bg-slate-900/80 border border-white/5 mb-3 text-[11px] flex items-center justify-between">
                        <span className="text-slate-400">연동 원단:</span>
                        <Link
                          href={`/fabric/${passport.fabric_snapshot.id}`}
                          className="font-mono text-sky-400 hover:underline font-semibold"
                        >
                          {passport.fabric_snapshot.id}
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                    <Link
                      href={`/p/${passport.id}`}
                      className="flex-1 py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      소비자 뷰 열기
                    </Link>
                    <button
                      onClick={() => setSelectedPassportForQR(passport)}
                      className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="QR 라벨 생성 및 인쇄"
                    >
                      <QrCode className="w-3.5 h-3.5 text-slate-300" />
                      QR 라벨
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 등록된 원단(소재) DPP 목록 */}
      <section className="py-12 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Layers className="w-6 h-6 text-sky-400" />
                원단 공급사 등록 소재 (Fabric DPPs)
              </h2>
              <p className="text-xs text-slate-400">
                패션 제조사가 제품 DPP 생성 시 직접 연동하여 사용할 수 있는 원단 고유 ID 목록입니다.
              </p>
            </div>

            <Link
              href="/fabric-supplier"
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto transition-all"
            >
              <Layers className="w-4 h-4" />
              신규 원단 소재 등록
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fabrics.map((fabric) => (
              <div
                key={fabric.id}
                className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-sky-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-sky-500/10 text-sky-400 border border-sky-500/30">
                      {fabric.id}
                    </span>
                    <span className="text-xs text-slate-400">{fabric.supplier_name} ({fabric.supplier_country})</span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">{fabric.name}</h3>

                  <div className="space-y-2 mb-4 text-xs text-slate-300">
                    <p>
                      <strong>혼용률:</strong>{' '}
                      {fabric.composition.map((c) => `${c.material} ${c.percentage}%`).join(', ')}
                    </p>
                    <p>
                      <strong>탄소 배출:</strong> {fabric.environmental_impact.carbonKgPerKg} kg CO₂e/kg |{' '}
                      <strong>중량:</strong> {fabric.weight_gsm} g/m²
                    </p>
                  </div>

                  {/* 인증 배지 */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {fabric.certifications.map((cert, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-2 py-0.5 rounded-md bg-slate-900 border border-white/10 text-[10px] font-semibold text-slate-300"
                      >
                        ✓ {cert.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    🛡️ {fabric.compliance_data.pfasFree ? 'PFAS-Free 친환경 방수' : '규제 적합'}
                  </span>
                  <Link
                    href={`/fabric/${fabric.id}`}
                    className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    원단 상세 명세서 <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QR 모달 */}
      {selectedPassportForQR && (
        <QRGeneratorModal
          passport={selectedPassportForQR}
          isOpen={true}
          onClose={() => setSelectedPassportForQR(null)}
        />
      )}
    </div>
  );
}
