'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  Clock,
  Factory,
  QrCode,
  ShieldX,
  Sparkles,
  XCircle
} from 'lucide-react';
import { Header } from '@/components/Header';
import { FilterPills, FilterSelect, ListToolbar } from '@/components/ListToolbar';
import { DomesticCertMark } from '@/components/cert/DomesticCertMark';
import { CertQrLabel } from '@/components/cert/CertQrLabel';
import type {
  CapabilityEvidence,
  CertReviewEvent,
  DomesticCertification,
  DomesticTrack,
  MarkIssue
} from '@/types/domesticCert';
import { INDUSTRY_LABEL, MARK_CARRIER_LABEL } from '@/types/domesticCert';
import {
  LIFECYCLE_LABEL,
  MARK_LIFECYCLE_LABEL,
  certLifecycleState,
  documentTitle,
  markLifecycleState,
  schemeLabel,
  trackMeta
} from '@/lib/domesticCert';
import { isLocallyAssignedCertNo } from '@/lib/certNumber';
import {
  getCertReviews,
  getCertifications,
  getCertificationById,
  getCertificationByCertNo,
  getMarkByNo,
  getMarkIssues
} from '@/lib/supabase';

const EVENT_LABEL: Record<string, string> = {
  submitted: '신청서 접수',
  doc_review: '서류심사',
  fee_paid: '수수료 납부',
  site_audit: '현장심사',
  approved: '적격성 검토 및 승인',
  issued: '계약체결 및 인증서 발급',
  rejected: '반려',
  revoked: '인증 취소',
  renewed: '재계약 갱신',
  post_market_check: '사후관리 점검',
  mark_issued: '마크 발급',
  mark_revoked: '마크 회수'
};

export function CertDocumentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const certNo = (searchParams?.get('no') ?? '').trim();
  const certId = (searchParams?.get('id') ?? '').trim();
  const markNo = (searchParams?.get('mark') ?? '').trim();
  const hasQuery = Boolean(certNo || certId || markNo);

  const [cert, setCert] = useState<DomesticCertification | null>(null);
  const [mark, setMark] = useState<MarkIssue | null>(null);
  const [marks, setMarks] = useState<MarkIssue[]>([]);
  const [reviews, setReviews] = useState<CertReviewEvent[]>([]);
  const [loading, setLoading] = useState(hasQuery);
  const [notFound, setNotFound] = useState(false);
  // 라벨 인쇄 대상 마크 (발급 이력에서 개별로 연다)
  const [labelMark, setLabelMark] = useState<MarkIssue | null>(null);
  // 국산인증 홈의 업체 목록
  const [allCerts, setAllCerts] = useState<DomesticCertification[]>([]);
  const [allMarks, setAllMarks] = useState<MarkIssue[]>([]);
  const [listLoading, setListLoading] = useState(!hasQuery);
  // 업체 목록 필터
  const [listQuery, setListQuery] = useState('');
  const [listState, setListState] = useState('');
  const [listTrack, setListTrack] = useState('');
  const [listIndustry, setListIndustry] = useState('');

  useEffect(() => {
    if (hasQuery) return;
    let alive = true;
    (async () => {
      setListLoading(true);
      try {
        const [list, marks] = await Promise.all([getCertifications(), getMarkIssues()]);
        if (alive) {
          setAllCerts(list);
          setAllMarks(marks);
        }
      } catch (err) {
        console.error('[GoDPP] 인증 업체 목록 로딩 실패:', err);
      } finally {
        if (alive) setListLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [hasQuery]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!hasQuery) {
        setLoading(false);
        setCert(null);
        setMark(null);
        setNotFound(false);
        return;
      }
      setLoading(true);
      setNotFound(false);
      try {
        let foundMark: MarkIssue | null = null;
        let foundCert: DomesticCertification | null = null;

        if (markNo) {
          foundMark = await getMarkByNo(decodeURIComponent(markNo));
          if (foundMark) foundCert = await getCertificationById(foundMark.cert_id);
        } else if (certNo) {
          foundCert = await getCertificationByCertNo(decodeURIComponent(certNo));
        } else {
          foundCert = await getCertificationById(decodeURIComponent(certId));
        }

        if (!alive) return;
        setMark(foundMark);
        setCert(foundCert);
        setNotFound(markNo ? !foundMark : !foundCert);

        if (foundCert) {
          const [rv, mk] = await Promise.all([
            getCertReviews(foundCert.id),
            getMarkIssues({ certId: foundCert.id })
          ]);
          if (!alive) return;
          setReviews(rv);
          setMarks(mk);
        }
      } catch (err) {
        console.error('[GoDPP] 인증 조회 실패:', err);
        if (alive) setNotFound(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [certNo, certId, markNo, hasQuery]);

  const lifecycle = useMemo(() => (cert ? certLifecycleState(cert) : null), [cert]);
  const evidence = (cert?.capability_evidence ?? {}) as CapabilityEvidence;

  // ---- 국산인증 홈 (파라미터 없음): 업체 목록 + 등록 진입 ----
  //      인증번호 조회 폼은 두지 않는다 — 목록 검색이 업체명·인증번호를 함께 받고,
  //      KTM- 마크 번호는 QR 스캔(/cert?mark=)이 진입 경로다.
  if (!hasQuery) {
    const active = allCerts.filter((c) => certLifecycleState(c) === 'active');
    const pending = allCerts.filter((c) => certLifecycleState(c) === 'in_review');

    // 업종 옵션은 실제 등록된 업체에서만 뽑는다 — 비어 있는 선택지를 만들지 않는다.
    const industryOptions: Array<[string, string]> = [
      ['', '업종 전체'],
      ...Array.from(new Set(allCerts.map((c) => c.industry).filter(Boolean)))
        .map((k) => [k as string, INDUSTRY_LABEL[k as keyof typeof INDUSTRY_LABEL]] as [string, string])
    ];

    const filtered = allCerts.filter((c) => {
      const state = certLifecycleState(c);
      if (listState === 'active' && state !== 'active') return false;
      if (listState === 'in_review' && state !== 'in_review') return false;
      if (listState === 'closed' && state !== 'expired' && state !== 'revoked' && state !== 'rejected')
        return false;

      if (listTrack) {
        const tracks = c.approved_tracks?.length ? c.approved_tracks : c.requested_tracks ?? [];
        if (!tracks.includes(listTrack as DomesticTrack)) return false;
      }
      if (listIndustry && c.industry !== listIndustry) return false;

      const q = listQuery.trim().toLowerCase();
      if (!q) return true;
      // 업체명·인증번호·사업자번호·대표자·소재지 중 아무 곳이나 걸리면 통과시킨다.
      return [c.company_name, c.cert_no, c.biz_no, c.representative, c.address]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });

    return (
      <div className="min-h-screen bg-slate-950 pb-20">
        <Header currentRole="consumer" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
          {/* 헤더 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-xl paper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/marks/korea-mark-symbol.png"
                    alt="국산 섬유제품 인증마크"
                    className="w-5 h-5 object-contain"
                  />
                </div>
                <h1 className="text-2xl font-black text-white">국산 섬유제품 인증</h1>
              </div>
              <p className="text-xs text-slate-400">
                한국섬유산업연합회(섬산련)가 업체 단위로 인증하고, 인증기업이 트랙별로 마크를 발급받아
                자사 제품에 부착합니다.
              </p>
            </div>

            <Link
              href="/cert-register"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
            >
              <Building2 className="w-4 h-4" /> 업체 등록
            </Link>
          </div>

          {/* 인증 업체 목록 */}
          <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-emerald-400" />
                인증 업체 목록 ({active.length}개사)
              </h3>
              <span className="text-xs text-slate-400">
                {pending.length > 0 ? `심사중 ${pending.length}개사` : 'KOFOTI Certified Companies'}
              </span>
            </div>

            <ListToolbar
              query={listQuery}
              onQueryChange={setListQuery}
              placeholder="업체명, 인증번호(K-TEX-), 사업자번호, 대표자, 소재지로 검색"
              shown={filtered.length}
              total={allCerts.length}
              unit="개사"
            >
              <FilterPills
                label="인증 상태"
                value={listState}
                onChange={setListState}
                options={[
                  ['', '전체'],
                  ['active', '유효'],
                  ['in_review', '심사중'],
                  ['closed', '만료·취소']
                ]}
              />
              <FilterPills
                label="트랙"
                value={listTrack}
                onChange={setListTrack}
                options={[
                  ['', '전 트랙'],
                  ['T1', 'T1'],
                  ['T2', 'T2'],
                  ['T3', 'T3']
                ]}
              />
              <FilterSelect
                label="업종"
                value={listIndustry}
                onChange={setListIndustry}
                options={industryOptions}
              />
            </ListToolbar>

            {listLoading ? (
              <p className="text-xs text-slate-500 text-center py-12">불러오는 중...</p>
            ) : allCerts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-12">등록된 인증 업체가 없습니다.</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 px-6">
                <p className="text-xs text-slate-400 font-semibold">조건에 맞는 업체가 없습니다.</p>
                <button
                  onClick={() => {
                    setListQuery('');
                    setListState('');
                    setListTrack('');
                    setListIndustry('');
                  }}
                  className="mt-3 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                >
                  필터 초기화
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filtered.map((c) => {
                  const state = certLifecycleState(c);
                  const tone =
                    state === 'active'
                      ? c.scheme === 'self_declaration'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : state === 'in_review'
                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                        : state === 'revoked' || state === 'rejected'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                          : 'bg-slate-500/10 text-slate-400 border-slate-600/50';
                  const tracks = c.approved_tracks?.length ? c.approved_tracks : c.requested_tracks ?? [];
                  const markCount = allMarks.filter((m) => m.cert_id === c.id).length;

                  // 마크는 계약이 유효하고 승인 트랙이 있는 업체만 발급받을 수 있다.
                  const canIssue = state === 'active' && (c.approved_tracks?.length ?? 0) > 0;

                  return (
                    <div
                      key={c.id}
                      className="p-5 sm:p-6 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {c.cert_no && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              {c.cert_no}
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold ${tone}`}
                          >
                            {state === 'active' && c.scheme === 'self_declaration'
                              ? '확인서'
                              : LIFECYCLE_LABEL[state]}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            {c.industry ? INDUSTRY_LABEL[c.industry] : '업종 미기재'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white mb-2">{c.company_name}</h4>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          {tracks.length > 0 && (
                            <span>
                              승인 트랙:{' '}
                              <strong className="text-slate-200">{tracks.join(' · ')}</strong>
                            </span>
                          )}
                          {markCount > 0 && (
                            <>
                              <span>•</span>
                              <span>마크 발급 {markCount}건</span>
                            </>
                          )}
                          {c.valid_until && (
                            <>
                              <span>•</span>
                              <span>
                                계약 {new Date(c.valid_until).toLocaleDateString('ko-KR')}까지
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end md:self-auto shrink-0">
                        {canIssue && (
                          <button
                            onClick={() => router.push(`/cert-mark?cert=${encodeURIComponent(c.id)}`)}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <QrCode className="w-4 h-4 text-emerald-400" />
                            인증마크 발급
                          </button>
                        )}
                        {c.cert_no && (
                          <button
                            onClick={() => router.push(`/cert?no=${encodeURIComponent(c.cert_no!)}`)}
                            className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            {documentTitle(c.scheme)} 보기
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Sparkles className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-sm font-medium">인증 정보를 조회하는 중...</p>
      </div>
    );
  }

  if (notFound || !cert) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Header currentRole="consumer" />
        <div className="max-w-md mx-auto px-4 pt-16 text-center glass-panel rounded-2xl p-8 mt-8">
          <XCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">등록되지 않은 번호입니다</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            <span className="font-mono text-rose-300">{markNo || certNo || certId}</span> 에 해당하는
            국산 섬유제품 인증 기록을 찾을 수 없습니다. 번호를 다시 확인해 주세요.
          </p>
          <button
            onClick={() => router.push('/cert')}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
          >
            다시 조회하기
          </button>
        </div>
      </div>
    );
  }

  const markState = mark ? markLifecycleState(mark, cert) : null;

  // ---- 상태 배너 (마크 조회면 마크 기준, 아니면 업체 인증 기준) ----
  const banner = (() => {
    if (mark) {
      if (markState === 'valid') {
        return cert.scheme === 'self_declaration'
          ? {
              tone: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
              Icon: BadgeCheck,
              title: '유효한 인증마크입니다',
              desc: `${cert.company_name}(확인기업)이 자기적합성선언에 근거해 발급받은 마크입니다.`
            }
          : {
              tone: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
              Icon: BadgeCheck,
              title: '유효한 인증마크입니다',
              desc: `${cert.company_name}(인증기업)이 섬산련 현장심사를 거쳐 발급받은 마크입니다.`
            };
      }
      return {
        tone:
          markState === 'cert_expired'
            ? 'bg-slate-700/25 border-slate-600/50 text-slate-300'
            : 'bg-rose-500/10 border-rose-500/40 text-rose-300',
        Icon: markState === 'cert_expired' ? Clock : ShieldX,
        title: MARK_LIFECYCLE_LABEL[markState!],
        desc:
          mark.revoke_reason ||
          cert.revoke_reason ||
          '발급 업체의 인증 상태에 따라 마크 효력이 상실되었습니다.'
      };
    }
    switch (lifecycle) {
      case 'active':
        return cert.scheme === 'self_declaration'
          ? {
              tone: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
              Icon: BadgeCheck,
              title: '유효한 확인서입니다',
              desc: '기업 자기적합성선언에 근거합니다. 제3자 현장심사를 거치지 않았습니다.'
            }
          : {
              tone: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
              Icon: BadgeCheck,
              title: '유효한 업체 인증입니다',
              desc: '섬산련 현장심사를 거쳐 계약이 체결된 인증기업입니다.'
            };
      case 'expired':
        return {
          tone: 'bg-slate-700/25 border-slate-600/50 text-slate-300',
          Icon: Clock,
          title: '계약기간이 만료되었습니다',
          desc: '재계약 요청 시 적격성 심사를 거쳐 갱신 여부가 결정됩니다.'
        };
      case 'revoked':
        return {
          tone: 'bg-rose-500/10 border-rose-500/40 text-rose-300',
          Icon: ShieldX,
          title: '취소된 업체 인증입니다',
          desc: cert.revoke_reason || '사후관리 결과에 따라 인증이 취소되었습니다.'
        };
      case 'rejected':
        return {
          tone: 'bg-rose-500/10 border-rose-500/40 text-rose-300',
          Icon: XCircle,
          title: '반려된 신청입니다',
          desc: cert.reject_reason || '심사 결과 요건을 충족하지 않아 반려되었습니다.'
        };
      default:
        return {
          tone: 'bg-sky-500/10 border-sky-500/40 text-sky-300',
          Icon: Clock,
          title: '업체 심사가 진행 중입니다',
          desc: '아직 인증번호가 부여되지 않았습니다. 계약체결 후 발급됩니다.'
        };
    }
  })();

  const BannerIcon = banner.Icon;
  const tracks = cert.approved_tracks?.length ? cert.approved_tracks : cert.requested_tracks ?? [];
  const headTrack = mark?.track ?? tracks[0] ?? null;

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Header currentRole="consumer" />

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-5 animate-fadeIn">
        <div className={`rounded-2xl border px-5 py-4 flex items-start gap-3 ${banner.tone}`}>
          <BannerIcon className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black">{banner.title}</p>
            <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">{banner.desc}</p>
          </div>
        </div>

        {isLocallyAssignedCertNo(cert.cert_no) && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-[11px] text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />
            이 번호는 서버 채번에 실패해 오프라인으로 발급된 임시 번호입니다. 온라인 복구 후 재발급이 필요합니다.
          </div>
        )}

        {/* 마크 조회(?mark=)로 들어왔을 때 — 어느 업체의 발급인지 알려주고 아래 인증서로 잇는다.
            마크는 업체에 발행되므로 마크 자체를 주인공으로 세우지 않는다. */}
        {mark && (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-5 py-4 flex items-start gap-4">
            <DomesticCertMark track={mark.track} size="md" showWordmark={false} />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                마크 발급번호 {mark.mark_no}
              </p>
              <p className="text-sm font-black text-white mt-0.5">{cert.company_name}</p>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {mark.track} {trackMeta(mark.track).en} 마크 · {MARK_CARRIER_LABEL[mark.carrier ?? 'hangtag']}
                {mark.issued_at && ` · ${new Date(mark.issued_at).toLocaleDateString('ko-KR')} 발급`}
              </p>
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                {trackMeta(mark.track).scope} 공정을 국내에서 수행하는 업체로 인증받았습니다.
                마크는 업체에 발행되며, 개별 제품의 이력은 해당 제품의 DPP에서 확인하세요.
              </p>
            </div>
          </div>
        )}

        {/* 업체 인증서 */}
        <section
          className={
            mark
              ? 'glass-panel rounded-2xl p-5 sm:p-6'
              : 'glass-panel-emerald rounded-3xl p-6 sm:p-8 border border-emerald-500/20'
          }
        >
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            {!mark && headTrack && (
              <DomesticCertMark
                track={headTrack}
                size="lg"
                certNo={cert.cert_no}
              />
            )}

            <div className="flex-1 text-center sm:text-left space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                국산 섬유제품 {documentTitle(cert.scheme)} (업체)
              </p>
              <h2 className={`font-black text-white leading-tight ${mark ? 'text-lg' : 'text-2xl'}`}>
                {cert.company_name}
              </h2>
              {cert.address && <p className="text-xs text-slate-400">{cert.address}</p>}

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 text-left">
                <div>
                  <dt className="text-[10px] text-slate-500 font-bold">인증번호</dt>
                  <dd className="text-xs font-mono text-emerald-300">{cert.cert_no ?? '미발급'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-slate-500 font-bold">신청번호</dt>
                  <dd className="text-xs font-mono text-slate-300">{cert.id}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-slate-500 font-bold">업종</dt>
                  <dd className="text-xs text-slate-200">
                    {cert.industry ? INDUSTRY_LABEL[cert.industry] : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] text-slate-500 font-bold">사업자등록번호</dt>
                  <dd className="text-xs font-mono text-slate-200">{cert.biz_no ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-slate-500 font-bold">검증방식</dt>
                  <dd className="text-xs text-slate-200">{schemeLabel(cert.scheme)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-slate-500 font-bold">승인 트랙</dt>
                  <dd className="text-xs text-slate-200">{tracks.join(', ') || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-slate-500 font-bold">대상품목</dt>
                  <dd className="text-xs text-slate-200">
                    {cert.product_classes?.length
                      ? cert.product_classes.map((c) => `제${c}류`).join(', ')
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] text-slate-500 font-bold">계약기간 (2년)</dt>
                  <dd className="text-xs text-slate-200">
                    {cert.valid_until
                      ? `${new Date(cert.valid_until).toLocaleDateString('ko-KR')}까지`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] text-slate-500 font-bold">인증기관</dt>
                  <dd className="text-xs text-slate-200">{cert.reviewer_org ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-slate-500 font-bold">심사원</dt>
                  <dd className="text-xs text-slate-200">{cert.reviewer_name ?? '—'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {evidence.factories?.length ? (
            <div className="mt-5 pt-4 border-t border-white/10">
              <p className="text-[10px] font-bold text-slate-500 mb-2 flex items-center gap-1">
                <Factory className="w-3 h-3" /> 등록 생산시설
              </p>
              <div className="flex flex-wrap gap-1.5">
                {evidence.factories.map((f, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-md bg-slate-900/60 border border-slate-700/50 text-[10px] text-slate-300"
                  >
                    {f.name} · {f.location}
                    {f.process ? ` · ${f.process}` : ''}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {/* 이 업체가 발급받은 마크 */}
        {marks.length > 0 && (
          <section className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-black text-slate-100 mb-1">마크 발급 이력</h2>
            <p className="text-[11px] text-slate-500 mb-4">
              계약 체결 후 트랙별로 발급받은 이력입니다. {marks.length}건 · 마크는 업체에 발행되며
              업체가 자사 제품에 부착합니다.
            </p>
            <div className="space-y-2">
              {marks.map((m) => {
                const state = markLifecycleState(m, cert);
                return (
                  <div
                    key={m.id}
                    className={`rounded-xl border px-4 py-3 ${
                      mark?.id === m.id
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : 'bg-slate-900/40 border-slate-700/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-100">
                          {m.track} {trackMeta(m.track).en}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {m.mark_no ?? '번호 미부여'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {MARK_CARRIER_LABEL[m.carrier ?? 'hangtag']}
                          {m.issued_at && ` · ${new Date(m.issued_at).toLocaleDateString('ko-KR')}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`text-[10px] font-black ${
                            state === 'valid' ? 'text-emerald-300' : 'text-slate-400'
                          }`}
                        >
                          {MARK_LIFECYCLE_LABEL[state]}
                        </p>
                      </div>
                    </div>

                    {/*
                      발급 매수·인쇄소·라벨 인쇄는 발급 주체(업체·인증기관)의 업무 정보다.
                      발급 매수는 생산량이라 공개 목록에 실을 정보가 아니므로 기본은 접어 둔다.
                      (계정·권한 도입 시 이 블록을 소속 업체에게만 노출하면 된다)
                    */}
                    <details className="mt-2.5">
                      <summary className="cursor-pointer text-[10px] font-bold text-slate-500 hover:text-slate-300 select-none">
                        발급 관리 정보 (사업자용)
                      </summary>
                      <div className="pt-2.5 space-y-2.5">
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div>
                            <dt className="text-[10px] text-slate-500 font-bold">발급 매수</dt>
                            <dd className="text-xs text-slate-200">
                              {m.quantity.toLocaleString()}매
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[10px] text-slate-500 font-bold">지정 인쇄소</dt>
                            <dd className="text-xs text-slate-200">{m.printer ?? '—'}</dd>
                          </div>
                        </dl>
                        {m.mark_no && (
                          <button
                            onClick={() => setLabelMark(m)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5"
                          >
                            <QrCode className="w-3.5 h-3.5" /> 마크 QR 라벨 인쇄
                          </button>
                        )}
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 품질기준 */}
        {cert.quality_declaration && 'esaArticle23' in cert.quality_declaration && (
          <section className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-black text-slate-100 mb-3">품질기준 선언</h2>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <p className="flex items-center gap-2">
                {cert.quality_declaration.esaArticle23 ? (
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                「전기용품 및 생활용품 안전관리법」 제23조 공급자적합성확인
              </p>
              <p className="flex items-center gap-2">
                {cert.quality_declaration.esaArticle46 ? (
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                동법 제46조 유해성평가 결과의 반영
              </p>
              {cert.quality_declaration.reportNo && (
                <p className="text-slate-400 pt-1">
                  시험성적서{' '}
                  <span className="font-mono text-slate-300">{cert.quality_declaration.reportNo}</span>
                  {cert.quality_declaration.testingLab && ` · ${cert.quality_declaration.testingLab}`}
                  {cert.quality_declaration.reportDate && ` · ${cert.quality_declaration.reportDate}`}
                </p>
              )}
            </div>
          </section>
        )}

        {/* 심사 이력 */}
        {reviews.length > 0 && (
          <section className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-black text-slate-100 mb-4">심사 및 사후관리 이력</h2>
            <ol className="space-y-3">
              {reviews.map((r) => (
                <li key={r.id} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-200">
                      {EVENT_LABEL[r.event] ?? r.event}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {r.actor_name}
                      {r.actor_org ? ` · ${r.actor_org}` : ''} ·{' '}
                      {new Date(r.created_at).toLocaleString('ko-KR')}
                    </p>
                    {r.comment && <p className="text-[10px] text-slate-400 mt-0.5">{r.comment}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <p className="text-[10px] text-slate-500 text-center leading-relaxed">
          본 화면은 kDPP 데모 환경의 자체 표기이며, 한국섬유산업연합회의 공식 인증 발급 시스템이
          아닙니다. 업체 인증 상태: {lifecycle ? LIFECYCLE_LABEL[lifecycle] : '—'}
        </p>
      </div>

      {labelMark && (
        <CertQrLabel
          mark={labelMark}
          cert={cert}
          isOpen
          onClose={() => setLabelMark(null)}
        />
      )}
    </div>
  );
}
