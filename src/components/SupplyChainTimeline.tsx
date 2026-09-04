'use client';

import React from 'react';
import Link from 'next/link';
import { SupplyChainStep } from '@/types/dpp';
import { CheckCircle2, MapPin, Building2, Award, ExternalLink, Calendar } from 'lucide-react';

interface SupplyChainTimelineProps {
  steps: SupplyChainStep[];
  fabricId?: string;
}

export const SupplyChainTimeline: React.FC<SupplyChainTimelineProps> = ({ steps, fabricId }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            공급망 추적성 (Supply Chain Traceability)
          </h3>
          <p className="text-xs text-slate-400">
            원자재 채취부터 완제품 봉제까지 블록체인 및 공인 인증 기반 무결성 검증
          </p>
        </div>
        {fabricId && (
          <Link
            href={`/fabric?id=${fabricId}`}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            연동 원단 DPP 보기
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-800 space-y-8 my-4">
        {steps.map((step, idx) => {
          const isFabricTier = step.tier === 'Tier-2' && fabricId;
          return (
            <div key={idx} className="relative group">
              {/* 타임라인 노드 아이콘 */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-7 h-7 rounded-full bg-slate-950 border-2 border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>

              {/* 내용 카드 */}
              <div className={`p-4 sm:p-5 rounded-2xl glass-panel transition-all ${
                isFabricTier 
                  ? 'border-emerald-500/40 bg-emerald-950/20 shadow-lg shadow-emerald-500/5' 
                  : 'border-white/10 hover:border-white/20'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {step.tier}
                    </span>
                    <h4 className="text-sm font-bold text-white">{step.step}</h4>
                  </div>
                  {step.processDate && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      {step.processDate}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">참여 기업</span>
                    <span className="text-slate-200 font-semibold">{step.companyName}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">사업장 위치 / 국가</span>
                    <span className="text-slate-200 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {step.location} ({step.country})
                    </span>
                  </div>
                </div>

                {/* 인증서 태그 */}
                {step.certifications && step.certifications.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      인증:
                    </span>
                    {step.certifications.map((c, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-800 text-slate-300 border border-white/10"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
