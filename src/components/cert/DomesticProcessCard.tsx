'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CircleHelp,
  ExternalLink,
  Factory,
  Link2Off,
  MapPin,
  XCircle
} from 'lucide-react';
import type {
  DomesticCertification,
  ProcessDetail,
  ProcessKey,
  TriState
} from '@/types/domesticCert';
import type { DomesticProcessSummary } from '@/lib/domesticCert';
import { LIFECYCLE_LABEL, PROCESS_LABEL, certLifecycleState, documentTitle } from '@/lib/domesticCert';

/**
 * 제품/원단의 국산 공정 이력 카드.
 *
 * 🔴 이 카드는 '인증'을 표시하지 않는다.
 *    국산인증은 업체(제조사)에 발행되므로 제품에는 트랙·마크·인증번호를 붙이지 않는다.
 *    여기서는 DPP가 실제로 보유한 공정별 국내/국외/미확인 사실만 보여주고,
 *    제조사가 인증기업이면 그 사실을 '업체에 대한 정보'로 한 줄 덧붙인다.
 */
interface DomesticProcessCardProps {
  summary: DomesticProcessSummary;
  subjectType: 'fabric' | 'passport';
  processDetails?: Partial<Record<ProcessKey, ProcessDetail>>;
  /** 제조사(원단이면 공급사)의 업체 인증 — 있으면 참고 정보로 표시 */
  manufacturerCert?: DomesticCertification | null;
  /** 제조사 표기명 (인증이 없을 때도 문구에 쓴다) */
  manufacturerName?: string;
  className?: string;
}

function FlagPill({ value }: { value: TriState }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/40 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
        <BadgeCheck className="w-3 h-3" /> 국내
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 border border-rose-500/40 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
        <XCircle className="w-3 h-3" /> 국외
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-500/10 border border-slate-600/50 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
      <CircleHelp className="w-3 h-3" /> 미확인
    </span>
  );
}

export function DomesticProcessCard({
  summary,
  subjectType,
  processDetails,
  manufacturerCert,
  manufacturerName,
  className = ''
}: DomesticProcessCardProps) {
  const { stages, processes, domesticCount, unknownCount, domesticRatio, ratioWarning } = summary;
  const noFabricLink =
    subjectType === 'passport' &&
    !summary.hasFabricLink &&
    processes.weaving === null &&
    processes.dyeing === null;

  const certState = manufacturerCert ? certLifecycleState(manufacturerCert) : null;

  return (
    <section className={`glass-panel rounded-2xl p-5 sm:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
            <Factory className="w-4 h-4 text-emerald-400" />
            국산 공정 이력
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            이 {subjectType === 'fabric' ? '원단' : '제품'}이 거친 공정의 국내 생산 여부
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-black text-slate-100 tabular-nums leading-none">
            {domesticCount}
            <span className="text-slate-500 text-sm"> / {stages.length}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">국내 공정</div>
        </div>
      </div>

      {noFabricLink && (
        <div className="rounded-xl border border-slate-600/50 bg-slate-700/20 px-4 py-3 mb-4">
          <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Link2Off className="w-3.5 h-3.5" /> 연결된 원단 DPP가 없습니다
          </p>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            제직·편직 및 염색·가공 공정의 국내 생산 여부를 확인할 근거가 없습니다.
          </p>
        </div>
      )}

      {/* 공정별 국산 여부 */}
      <div className="space-y-2 mb-4">
        {stages.map((stage) => {
          const detail = processDetails?.[stage];
          return (
            <div
              key={stage}
              className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/40 border border-slate-700/40 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-200">{PROCESS_LABEL[stage]}</p>
                {detail?.companyName && (
                  <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    {detail.companyName}
                    {detail.location ? ` · ${detail.location}` : ''}
                  </p>
                )}
              </div>
              <FlagPill value={processes[stage]} />
            </div>
          );
        })}
      </div>

      {unknownCount > 0 && !noFabricLink && (
        <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
          미확인 {unknownCount}건은 아직 자료가 등록되지 않은 공정입니다. 국외 생산을 뜻하지 않습니다.
        </p>
      )}

      {/* 국산 소재 혼용률 (참고 지표) */}
      <div className="rounded-lg bg-slate-900/40 border border-slate-700/40 px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-slate-300">국산 소재 혼용률</p>
            <p className="text-[9px] text-slate-500">참고 지표 — 공정 이력과는 별개입니다</p>
          </div>
          <span className="text-lg font-black text-slate-100 tabular-nums">
            {domesticRatio === null ? '—' : `${domesticRatio}%`}
          </span>
        </div>
        {domesticRatio === null && (
          <p className="text-[10px] text-slate-500 mt-1.5">
            소재별 국산 여부가 등록되지 않아 산출 근거가 없습니다.
          </p>
        )}
        {ratioWarning === 'COMPOSITION_SUM_NOT_100' && (
          <p className="text-[10px] text-amber-300 mt-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            혼용률 합계가 100%가 아니어서 실제 합계 기준으로 정규화했습니다.
          </p>
        )}
      </div>

      {/* 제조사(업체) 인증 — 제품이 아니라 업체에 대한 사실이다 */}
      {manufacturerCert && certState === 'active' && (
        <div className="mt-4 rounded-xl bg-slate-900/40 border border-slate-700/40 px-4 py-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> 제조사 국산인증
              </p>
              <p className="text-xs font-bold text-slate-100 mt-0.5">
                {manufacturerCert.company_name}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                섬산련 국산 섬유제품 {documentTitle(manufacturerCert.scheme)} 보유
                {manufacturerCert.approved_tracks?.length > 0 &&
                  ` · ${manufacturerCert.approved_tracks.join('·')}`}
                {manufacturerCert.cert_no && ` · ${manufacturerCert.cert_no}`}
              </p>
            </div>
            {manufacturerCert.cert_no && (
              <Link
                href={`/cert?no=${encodeURIComponent(manufacturerCert.cert_no)}`}
                className="text-[11px] font-bold text-slate-300 hover:text-emerald-300 inline-flex items-center gap-1 shrink-0"
              >
                업체 인증 보기 <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
            국산인증은 업체 단위로 발행됩니다. 이 {subjectType === 'fabric' ? '원단' : '제품'} 자체가
            개별 인증을 받은 것은 아닙니다.
          </p>
        </div>
      )}

      {manufacturerCert && certState && certState !== 'active' && (
        <div className="mt-4 rounded-xl bg-slate-900/40 border border-slate-700/40 px-4 py-3">
          <p className="text-[11px] text-slate-400">
            제조사 {manufacturerCert.company_name}의 국산인증 상태:{' '}
            <span className="font-bold text-slate-200">{LIFECYCLE_LABEL[certState]}</span>
          </p>
        </div>
      )}

      {!manufacturerCert && manufacturerName && (
        <p className="mt-4 text-[10px] text-slate-500 leading-relaxed">
          {manufacturerName}는 섬산련 국산 섬유제품 인증기업으로 등록되어 있지 않습니다. 위 공정 이력은
          DPP에 신고된 자료이며 제3자 검증을 거치지 않았습니다.
        </p>
      )}
    </section>
  );
}
