'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  BadgeCheck,
  ClipboardList,
  ExternalLink,
  RefreshCw,
  ShieldX,
  Sparkles,
  UserCog,
  XCircle
} from 'lucide-react';
import { Header } from '@/components/Header';
import { DomesticCertMark } from '@/components/cert/DomesticCertMark';
import type {
  CapabilityEvidence,
  CertReviewEvent,
  CertStatus,
  DomesticCertification,
  DomesticTrack,
  ReviewChecklist
} from '@/types/domesticCert';
import { INDUSTRY_LABEL } from '@/types/domesticCert';
import {
  LIFECYCLE_LABEL,
  addTwoYears,
  certLifecycleState,
  documentTitle,
  schemeLabel,
  trackMeta
} from '@/lib/domesticCert';
import { reserveCertNo } from '@/lib/certNumber';
import { appendCertReview, getCertReviews, getCertifications, saveCertification } from '@/lib/supabase';

type Tab = 'queue' | 'issued' | 'closed';

const TAB_STATUS: Record<Tab, CertStatus[]> = {
  queue: ['submitted', 'under_review', 'approved'],
  issued: ['issued'],
  closed: ['rejected', 'revoked']
};

const TAB_LABEL: Record<Tab, string> = {
  queue: '심사 대기·진행',
  issued: '발급 완료',
  closed: '반려·취소'
};

const CHECKLIST_ITEMS: Array<{ key: keyof ReviewChecklist; label: string }> = [
  { key: 'docReview', label: '서류심사' },
  { key: 'feePaid', label: '수수료 납부' },
  { key: 'siteAudit', label: '현장심사' },
  { key: 'eligibility', label: '적격성 검토' },
  { key: 'contract', label: '계약체결' }
];

const EVENT_LABEL: Record<string, string> = {
  submitted: '신청서 접수',
  doc_review: '서류심사',
  fee_paid: '수수료 납부',
  site_audit: '현장심사',
  approved: '승인',
  issued: '발급',
  rejected: '반려',
  revoked: '취소',
  renewed: '갱신',
  post_market_check: '사후관리 점검',
  mark_issued: '마크 발급',
  mark_revoked: '마크 회수'
};

const ALL_TRACKS: DomesticTrack[] = ['T1', 'T2', 'T3'];

/** 업체 인증 상태 pill (마크가 아니라 계약 상태를 보여준다) */
function CertStatusPill({ cert }: { cert: DomesticCertification }) {
  const state = certLifecycleState(cert);
  const tone =
    state === 'active'
      ? cert.scheme === 'self_declaration'
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
      : state === 'in_review'
        ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
        : state === 'rejected' || state === 'revoked'
          ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
          : 'bg-slate-500/10 text-slate-400 border-slate-600/50';
  const label =
    state === 'active' && cert.scheme === 'self_declaration'
      ? '확인서 유효'
      : LIFECYCLE_LABEL[state];
  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${tone}`}>
      {label}
    </span>
  );
}

export function CertReviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramId = searchParams?.get('id') ? decodeURIComponent(searchParams.get('id')!).trim() : '';

  const [certs, setCerts] = useState<DomesticCertification[]>([]);
  const [tab, setTab] = useState<Tab>('queue');
  const [selectedId, setSelectedId] = useState<string>(paramId);
  const [reviews, setReviews] = useState<CertReviewEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // 심사원 신원 — 로그인이 없는 데모이므로 화면에서 입력받아 감사 로그에 남긴다.
  const [reviewer, setReviewer] = useState({
    name: '',
    org: '한국섬유산업연합회(섬산련)'
  });
  const [checklist, setChecklist] = useState<ReviewChecklist>({});
  /** 심사원이 승인하는 트랙. 신청 트랙에서 축소/확대할 수 있다. */
  const [approvedTracks, setApprovedTracks] = useState<DomesticTrack[]>([]);
  const [decisionReason, setDecisionReason] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getCertifications();
      setCerts(list);
    } catch (err) {
      console.error('[GoDPP] 인증 심사 큐 로딩 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const selected = useMemo(
    () => certs.find((c) => c.id === selectedId) ?? null,
    [certs, selectedId]
  );

  // 선택이 바뀌면 체크리스트/사유를 해당 건의 값으로 초기화한다.
  useEffect(() => {
    if (!selected) {
      setChecklist({});
      setApprovedTracks([]);
      setDecisionReason('');
      setReviews([]);
      return;
    }
    setChecklist(selected.review_checklist ?? {});
    setApprovedTracks(
      selected.approved_tracks?.length ? selected.approved_tracks : selected.requested_tracks ?? []
    );
    setDecisionReason('');
    let alive = true;
    (async () => {
      const r = await getCertReviews(selected.id);
      if (alive) setReviews(r);
    })();
    return () => {
      alive = false;
    };
  }, [selected]);

  const visible = useMemo(
    () => certs.filter((c) => TAB_STATUS[tab].includes(c.status)),
    [certs, tab]
  );

  const counts = useMemo(
    () =>
      (Object.keys(TAB_STATUS) as Tab[]).reduce<Record<Tab, number>>(
        (acc, t) => {
          acc[t] = certs.filter((c) => TAB_STATUS[t].includes(c.status)).length;
          return acc;
        },
        { queue: 0, issued: 0, closed: 0 }
      ),
    [certs]
  );

  const reviewerOk = reviewer.name.trim().length > 0;

  async function persist(
    next: DomesticCertification,
    event: Parameters<typeof appendCertReview>[0]['event'],
    comment: string
  ) {
    await saveCertification(next);
    await appendCertReview({
      cert_id: next.id,
      subject_id: next.id,
      event,
      actor_name: reviewer.name.trim(),
      actor_org: reviewer.org.trim() || undefined,
      actor_role: 'cert_auditor',
      comment
    });
    await reload();
    setReviews(await getCertReviews(next.id));
  }

  async function handleSaveChecklist() {
    if (!selected || !reviewerOk) return;
    setWorking(true);
    try {
      const done = CHECKLIST_ITEMS.filter((i) => checklist[i.key]).map((i) => i.label);
      await persist(
        {
          ...selected,
          status: selected.status === 'submitted' ? 'under_review' : selected.status,
          review_checklist: checklist,
          reviewer_name: reviewer.name.trim(),
          reviewer_org: reviewer.org.trim(),
          reviewed_at: new Date().toISOString()
        },
        'doc_review',
        done.length ? `절차 확인: ${done.join(', ')}` : '심사 착수'
      );
      setNotice('심사 진행 상황을 저장했습니다.');
    } finally {
      setWorking(false);
    }
  }

  async function handleApprove() {
    if (!selected || !reviewerOk) return;
    setWorking(true);
    setNotice(null);
    try {
      const certNo = selected.cert_no ?? (await reserveCertNo(new Date().getFullYear()));
      const now = new Date().toISOString();
      // 심사원이 조정하지 않았으면 신청 트랙을 그대로 승인한다.
      const granted = approvedTracks.length ? approvedTracks : selected.requested_tracks;

      const next: DomesticCertification = {
        ...selected,
        cert_no: certNo,
        approved_tracks: granted,
        status: 'issued',
        review_checklist: checklist,
        reviewer_name: reviewer.name.trim(),
        reviewer_org: reviewer.org.trim(),
        reviewed_at: now,
        issued_at: now,
        valid_until: addTwoYears(now),
        reject_reason: null
      };

      await saveCertification(next);
      await appendCertReview({
        cert_id: next.id,
        subject_id: next.id,
        event: 'approved',
        actor_name: reviewer.name.trim(),
        actor_org: reviewer.org.trim() || undefined,
        actor_role: 'cert_auditor',
        comment: decisionReason.trim() || `적격성 검토 완료 · 승인 트랙 ${granted.join(', ') || '없음'}`
      });
      await appendCertReview({
        cert_id: next.id,
        subject_id: next.id,
        event: 'issued',
        actor_name: reviewer.name.trim(),
        actor_org: reviewer.org.trim() || undefined,
        actor_role: 'cert_auditor',
        comment: `${documentTitle(next.scheme)} 발급 · ${certNo}`
      });

      await reload();
      setReviews(await getCertReviews(next.id));
      setTab('issued');
      setNotice(`인증번호 ${certNo} 를 발급했습니다. (승인 트랙 ${granted.join(', ')})`);
    } catch (err: any) {
      console.error('[GoDPP] 인증 발급 실패:', err);
      setNotice(err?.message || '발급 처리 중 오류가 발생했습니다.');
    } finally {
      setWorking(false);
    }
  }

  async function handleReject() {
    if (!selected || !reviewerOk || !decisionReason.trim()) return;
    setWorking(true);
    try {
      await persist(
        {
          ...selected,
          status: 'rejected',
          review_checklist: checklist,
          reviewer_name: reviewer.name.trim(),
          reviewer_org: reviewer.org.trim(),
          reviewed_at: new Date().toISOString(),
          reject_reason: decisionReason.trim()
        },
        'rejected',
        decisionReason.trim()
      );
      setTab('closed');
      setNotice('신청을 반려했습니다.');
    } finally {
      setWorking(false);
    }
  }

  async function handleRevoke() {
    if (!selected || !reviewerOk || !decisionReason.trim()) return;
    setWorking(true);
    try {
      await persist(
        {
          ...selected,
          status: 'revoked',
          reviewer_name: reviewer.name.trim(),
          reviewer_org: reviewer.org.trim(),
          reviewed_at: new Date().toISOString(),
          revoke_reason: decisionReason.trim()
        },
        'revoked',
        decisionReason.trim()
      );
      setTab('closed');
      setNotice('사후관리 결과에 따라 인증을 취소했습니다.');
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Sparkles className="w-8 h-8 text-sky-400 animate-spin mb-3" />
        <p className="text-sm font-medium">인증 심사 큐를 불러오는 중...</p>
      </div>
    );
  }

  const selTracks = selected ? (selected.approved_tracks?.length ? selected.approved_tracks : selected.requested_tracks) : [];
  const selTrack = selTracks[0] ?? null;
  const evidence = (selected?.capability_evidence ?? {}) as CapabilityEvidence;

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Header currentRole="cert_auditor" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-sky-400" />
              국산 섬유제품 인증 심사
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              신청 접수 → 서류심사 → 수수료 납부 → 현장심사 → 적격성 검토 → 계약체결 → 마크발급
            </p>
          </div>
          <button
            onClick={reload}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 새로고침
          </button>
        </div>

        {/* 심사원 신원 — 로그인이 없으므로 감사 로그에 남길 신원을 직접 입력받는다 */}
        <div className="glass-panel-blue rounded-2xl p-4 border border-sky-500/30">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <UserCog className="w-5 h-5 text-sky-400" />
              <span className="text-xs font-black text-slate-100">심사원 신원</span>
            </div>
            <label className="flex-1">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">
                심사원 성명 <span className="text-rose-400">*</span>
              </span>
              <input
                value={reviewer.name}
                onChange={(e) => setReviewer({ ...reviewer, name: e.target.value })}
                className="glass-input w-full px-3 py-1.5 rounded-lg text-xs"
                placeholder="예: 홍길동"
              />
            </label>
            <label className="flex-1">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">소속 기관</span>
              <input
                value={reviewer.org}
                onChange={(e) => setReviewer({ ...reviewer, org: e.target.value })}
                className="glass-input w-full px-3 py-1.5 rounded-lg text-xs"
              />
            </label>
          </div>
          {!reviewerOk && (
            <p className="text-[10px] text-amber-300 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              모든 심사 처분은 감사 로그에 기록됩니다. 심사원 성명을 입력해야 승인·반려·취소가
              가능합니다.
            </p>
          )}
        </div>

        {notice && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
            {notice}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* 좌: 큐 */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex gap-1.5">
              {(Object.keys(TAB_STATUS) as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 px-2.5 py-2 rounded-xl text-[11px] font-bold transition-all ${
                    tab === t
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-700/60 hover:text-slate-200'
                  }`}
                >
                  {TAB_LABEL[t]} ({counts[t]})
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {visible.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left glass-panel rounded-xl p-3.5 border transition-all ${
                    selectedId === c.id
                      ? 'border-sky-500/60 bg-sky-500/5'
                      : 'border-white/10 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-100 truncate">{c.company_name}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {c.industry ? INDUSTRY_LABEL[c.industry] : '—'}
                        {c.biz_no ? ` · ${c.biz_no}` : ''}
                      </p>
                    </div>
                    <CertStatusPill cert={c} />
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                    <span className="font-mono">{c.cert_no ?? c.id}</span>
                    <span>·</span>
                    <span>{c.scheme === 'third_party' ? '제3자' : '자율'}</span>
                    {c.created_at && (
                      <>
                        <span>·</span>
                        <span>{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                      </>
                    )}
                  </div>
                </button>
              ))}
              {visible.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-10 glass-panel rounded-xl">
                  해당 상태의 신청 건이 없습니다.
                </p>
              )}
            </div>
          </div>

          {/* 우: 상세 */}
          <div className="lg:col-span-3">
            {!selected ? (
              <div className="glass-panel rounded-2xl p-10 text-center">
                <ClipboardList className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-xs text-slate-400">좌측 목록에서 심사할 신청 건을 선택하세요.</p>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                {/* 신청 개요 */}
                <section className="glass-panel rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <h2 className="text-base font-black text-white">{selected.company_name}</h2>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {selected.industry ? INDUSTRY_LABEL[selected.industry] : '—'}
                        {selected.biz_no && ` · ${selected.biz_no}`}
                        {selected.representative && ` · 대표 ${selected.representative}`}
                      </p>
                      {selected.address && (
                        <p className="text-[10px] text-slate-500 mt-0.5">{selected.address}</p>
                      )}
                      <p className="text-[10px] font-mono text-slate-500 mt-1">
                        {selected.id}
                        {selected.cert_no && ` · ${selected.cert_no}`}
                      </p>
                    </div>
                    {selTrack && (
                      <DomesticCertMark track={selTrack} size="md" showWordmark={false} />
                    )}
                  </div>

                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                    <div>
                      <dt className="text-slate-500 font-bold text-[10px]">검증방식</dt>
                      <dd className="text-slate-200">{schemeLabel(selected.scheme)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-bold text-[10px]">신청 트랙</dt>
                      <dd className="text-slate-200">
                        {selected.requested_tracks?.length ? selected.requested_tracks.join(', ') : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-bold text-[10px]">대상품목 (상품류)</dt>
                      <dd className="text-slate-200">
                        {selected.product_classes?.length
                          ? selected.product_classes.map((c) => `제${c}류`).join(', ')
                          : '—'}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Link
                      href={`/cert?id=${encodeURIComponent(selected.id)}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1"
                    >
                      발급 문서 미리보기 <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </section>

                {/* 심사 근거: 업체 생산 역량 */}
                <section className="glass-panel rounded-2xl p-5">
                  <h3 className="text-xs font-black text-slate-100 mb-3">
                    심사 근거 (생산 역량 · 현장심사 대상)
                  </h3>

                  {evidence.factories?.length ? (
                    <div className="space-y-1.5 mb-3">
                      {evidence.factories.map((f, i) => (
                        <div
                          key={i}
                          className="rounded-lg bg-slate-900/50 border border-slate-700/50 px-3 py-2 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-200 truncate">{f.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{f.location}</p>
                          </div>
                          {f.process && (
                            <span className="text-[10px] font-bold text-emerald-300 shrink-0">
                              {f.process}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 mb-3">등록된 생산 공장 정보가 없습니다.</p>
                  )}

                  {evidence.representativeSubjectIds?.length ? (
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 mb-1.5">대표 품목</p>
                      <div className="flex flex-wrap gap-1.5">
                        {evidence.representativeSubjectIds.map((sid) => (
                          <Link
                            key={sid}
                            href={
                              sid.startsWith('FAB-')
                                ? `/fabric?id=${encodeURIComponent(sid)}`
                                : `/p?id=${encodeURIComponent(sid)}`
                            }
                            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 inline-flex items-center gap-1"
                          >
                            {sid} <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {evidence.note && (
                    <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">{evidence.note}</p>
                  )}

                  {'esaArticle23' in (selected.quality_declaration ?? {}) && (
                    <p className="text-[10px] text-slate-400 mt-3">
                      품질기준 선언: 전안법 제23조{' '}
                      {(selected.quality_declaration as any).esaArticle23 ? '✓' : '✗'} · 제46조{' '}
                      {(selected.quality_declaration as any).esaArticle46 ? '✓' : '✗'}
                      {(selected.quality_declaration as any).reportNo &&
                        ` · 성적서 ${(selected.quality_declaration as any).reportNo}`}
                    </p>
                  )}
                </section>

                {/* 심사 절차 체크리스트 */}
                {selected.status !== 'rejected' && selected.status !== 'revoked' && (
                  <section className="glass-panel rounded-2xl p-5">
                    <h3 className="text-xs font-black text-slate-100 mb-3">심사 절차 확인</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                      {CHECKLIST_ITEMS.map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-2 rounded-lg bg-slate-900/50 border border-slate-700/50 px-3 py-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(checklist[item.key])}
                            onChange={(e) =>
                              setChecklist({ ...checklist, [item.key]: e.target.checked })
                            }
                            className="w-3.5 h-3.5 accent-sky-500"
                          />
                          <span className="text-[11px] text-slate-300">{item.label}</span>
                        </label>
                      ))}
                    </div>

                    {/* 승인 트랙 — 신청 트랙에서 심사원이 조정한다 */}
                    <div className="mb-3">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1.5">
                        승인 트랙 (마크 발급 가능 범위)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_TRACKS.map((t) => {
                          const on = approvedTracks.includes(t);
                          const requested = selected.requested_tracks?.includes(t);
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() =>
                                setApprovedTracks(
                                  on ? approvedTracks.filter((x) => x !== t) : [...approvedTracks, t]
                                )
                              }
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                on
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                                  : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                              }`}
                              title={requested ? '신청 트랙' : '신청하지 않은 트랙'}
                            >
                              {t} {trackMeta(t).en}
                              {!requested && <span className="ml-1 opacity-60">(미신청)</span>}
                            </button>
                          );
                        })}
                      </div>
                      {approvedTracks.length === 0 && (
                        <p className="text-[10px] text-amber-300 mt-1.5">
                          승인 트랙이 없으면 이 업체는 마크를 발급받을 수 없습니다.
                        </p>
                      )}
                    </div>

                    <label className="block mb-3">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">
                        심사 의견 / 처분 사유
                      </span>
                      <textarea
                        value={decisionReason}
                        onChange={(e) => setDecisionReason(e.target.value)}
                        rows={2}
                        className="glass-input w-full px-3 py-2 rounded-xl text-xs resize-none"
                        placeholder="반려·취소 시 필수. 승인 시에는 선택 입력."
                      />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {selected.status !== 'issued' && (
                        <>
                          <button
                            onClick={handleSaveChecklist}
                            disabled={!reviewerOk || working}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-[11px] font-bold"
                          >
                            진행 상황 저장
                          </button>
                          <button
                            onClick={handleApprove}
                            disabled={!reviewerOk || working}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 text-[11px] font-bold flex items-center gap-1.5"
                          >
                            <BadgeCheck className="w-3.5 h-3.5" />
                            승인 및 {documentTitle(selected.scheme)} 발급
                          </button>
                          <button
                            onClick={handleReject}
                            disabled={!reviewerOk || working || !decisionReason.trim()}
                            className="px-3.5 py-2 rounded-xl border border-rose-500/40 hover:bg-rose-500/10 disabled:opacity-40 disabled:cursor-not-allowed text-rose-300 text-[11px] font-bold flex items-center gap-1.5"
                            title={!decisionReason.trim() ? '반려 사유를 입력해야 합니다' : undefined}
                          >
                            <XCircle className="w-3.5 h-3.5" /> 반려
                          </button>
                        </>
                      )}
                      {selected.status === 'issued' && (
                        <button
                          onClick={handleRevoke}
                          disabled={!reviewerOk || working || !decisionReason.trim()}
                          className="px-3.5 py-2 rounded-xl border border-rose-500/40 hover:bg-rose-500/10 disabled:opacity-40 disabled:cursor-not-allowed text-rose-300 text-[11px] font-bold flex items-center gap-1.5"
                          title={!decisionReason.trim() ? '취소 사유를 입력해야 합니다' : undefined}
                        >
                          <ShieldX className="w-3.5 h-3.5" /> 사후관리 — 인증 취소
                        </button>
                      )}
                    </div>
                  </section>
                )}

                {(selected.reject_reason || selected.revoke_reason) && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-[11px] text-rose-300">
                    <strong>{selected.reject_reason ? '반려' : '취소'} 사유:</strong>{' '}
                    {selected.reject_reason || selected.revoke_reason}
                  </div>
                )}

                {/* 이력 */}
                {reviews.length > 0 && (
                  <section className="glass-panel rounded-2xl p-5">
                    <h3 className="text-xs font-black text-slate-100 mb-3">심사 이력</h3>
                    <ol className="space-y-2.5">
                      {reviews.map((r) => (
                        <li key={r.id} className="flex gap-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-200">
                              {EVENT_LABEL[r.event] ?? r.event}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {r.actor_name}
                              {r.actor_org ? ` · ${r.actor_org}` : ''} ·{' '}
                              {new Date(r.created_at).toLocaleString('ko-KR')}
                            </p>
                            {r.comment && (
                              <p className="text-[10px] text-slate-400 mt-0.5">{r.comment}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
