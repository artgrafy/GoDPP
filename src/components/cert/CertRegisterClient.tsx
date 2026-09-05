'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  FileCheck2,
  Factory,
  UserCheck
} from 'lucide-react';
import { Header } from '@/components/Header';
import { DomesticCertMark } from '@/components/cert/DomesticCertMark';
import type { FabricDPP, FashionDPP } from '@/types/dpp';
import type {
  CapabilityEvidence,
  CertScheme,
  DomesticCertification,
  DomesticTrack,
  Industry,
  QualityDeclaration
} from '@/types/domesticCert';
import { INDUSTRY_LABEL } from '@/types/domesticCert';
import { addTwoYears, documentTitle, evaluateTrack, schemeLabel, trackMeta } from '@/lib/domesticCert';
import { newApplicationId } from '@/lib/certNumber';
import {
  appendCertReview,
  findOrCreateCompany,
  getCertifications,
  getFabrics,
  getPassports,
  saveCertification
} from '@/lib/supabase';

const ALL_TRACKS: DomesticTrack[] = ['T1', 'T2', 'T3'];
const ALL_INDUSTRIES: Industry[] = ['fashion', 'school', 'sports', 'bedding', 'fabric', 'etc'];
const PRODUCT_CLASSES: Array<{ v: '23' | '24' | '25'; label: string }> = [
  { v: '23', label: '제23류 — 직물용 실' },
  { v: '24', label: '제24류 — 직물 및 그 대용품' },
  { v: '25', label: '제25류 — 의류, 신발, 모자' }
];

/**
 * 인증 업체 등록.
 *
 * kDPP는 인증기관이 아니다 — 인증은 한국섬유산업연합회가 심사·계약을 통해 발급한다.
 * 이 화면은 **이미 섬산련 인증을 받은 업체**를 플랫폼에 기록해, 그 업체가 자사 제품에
 * 인증마크를 발급·부착하고 소비자·바이어가 검증할 수 있게 하는 것이 목적이다.
 * 따라서 인증번호·발급일은 섬산련이 부여한 값을 그대로 입력받으며, 이 화면에서 채번하지 않는다.
 */
export function CertRegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [company, setCompany] = useState({
    name: '',
    bizNo: '',
    representative: '',
    address: '',
    contact: ''
  });
  const [industry, setIndustry] = useState<Industry>('fashion');
  const [tracks, setTracks] = useState<DomesticTrack[]>([]);
  const [classes, setClasses] = useState<Array<'23' | '24' | '25'>>(['25']);
  const [scheme, setScheme] = useState<CertScheme>('third_party');
  const [certNo, setCertNo] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [quality, setQuality] = useState<QualityDeclaration>({
    esaArticle23: false,
    esaArticle46: false,
    reportNo: '',
    reportDate: '',
    testingLab: ''
  });
  const [factory, setFactory] = useState({ name: '', location: '', process: '' });
  const [representativeIds, setRepresentativeIds] = useState<string[]>([]);

  const [fabrics, setFabrics] = useState<FabricDPP[]>([]);
  const [passports, setPassports] = useState<FashionDPP[]>([]);
  const [existing, setExisting] = useState<DomesticCertification[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [f, p, c] = await Promise.all([getFabrics(), getPassports(), getCertifications()]);
        if (!alive) return;
        setFabrics(f);
        setPassports(p);
        setExisting(c);
        const s = searchParams?.get('subject');
        if (s) setRepresentativeIds([decodeURIComponent(s).trim()]);
      } catch (err) {
        console.error('[GoDPP] 등록 폼 데이터 로딩 실패:', err);
      }
    })();
    return () => {
      alive = false;
    };
  }, [searchParams]);

  /** 대표 품목의 트랙 판정 — 등록한 트랙과 실제 공정이 맞는지 확인하는 참고 자료 */
  const evidenceVerdicts = useMemo(() => {
    return representativeIds
      .map((id) => {
        const fab = fabrics.find((f) => f.id === id);
        if (fab)
          return {
            id,
            name: fab.name,
            verdict: evaluateTrack({ subjectType: 'fabric', fabric: fab })
          };
        const psp = passports.find((p) => p.id === id);
        if (psp)
          return {
            id,
            name: psp.product_name,
            verdict: evaluateTrack({
              subjectType: 'passport',
              passport: psp,
              fabric: psp.fabric_snapshot ?? null
            })
          };
        return null;
      })
      .filter(Boolean) as Array<{ id: string; name: string; verdict: ReturnType<typeof evaluateTrack> }>;
  }, [representativeIds, fabrics, passports]);

  const trimmedNo = certNo.trim().toUpperCase();
  const duplicateNo = existing.some((c) => (c.cert_no || '').toUpperCase() === trimmedNo && trimmedNo);
  const duplicateCompany = existing.some(
    (c) => c.company_name.trim() === company.name.trim() && company.name.trim()
  );
  const qualityOk = quality.esaArticle23 && quality.esaArticle46;
  const canSubmit =
    company.name.trim().length > 0 &&
    trimmedNo.length > 0 &&
    !duplicateNo &&
    tracks.length > 0 &&
    classes.length > 0 &&
    qualityOk &&
    !submitting;

  function toggle<T>(list: T[], v: T, set: (x: T[]) => void) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const issued = issuedAt ? new Date(issuedAt).toISOString() : now;

      const evidence: CapabilityEvidence = {
        factories: factory.name.trim()
          ? [
              {
                name: factory.name.trim(),
                location: factory.location.trim(),
                process: factory.process.trim() || undefined
              }
            ]
          : [],
        representativeSubjectIds: representativeIds
      };

      // 업체 마스터에 먼저 등록/조회한다 — 이름이 아니라 company_id 가 소유권의 기준이다.
      const master = await findOrCreateCompany({
        name: company.name.trim(),
        bizNo: company.bizNo.trim() || null,
        representative: company.representative.trim() || null,
        address: company.address.trim() || null,
        contact: company.contact.trim() || null,
        industry
      });

      const cert: DomesticCertification = {
        id: newApplicationId(),
        cert_no: trimmedNo,
        company_id: master.id,
        company_name: company.name.trim(),
        biz_no: company.bizNo.trim() || undefined,
        representative: company.representative.trim() || undefined,
        address: company.address.trim() || undefined,
        contact: company.contact.trim() || undefined,
        industry,
        scheme,
        // 이미 발급된 인증을 기록하는 것이므로 신청 트랙과 승인 트랙이 같다.
        requested_tracks: tracks,
        approved_tracks: tracks,
        product_classes: classes,
        status: 'issued',
        quality_declaration: quality,
        capability_evidence: evidence,
        review_checklist: {
          docReview: true,
          feePaid: true,
          siteAudit: scheme === 'third_party',
          eligibility: true,
          contract: true
        },
        reviewer_org: '한국섬유산업연합회(섬산련)',
        issued_at: issued,
        valid_until: addTwoYears(issued),
        created_at: now,
        updated_at: now
      };

      await saveCertification(cert);
      await appendCertReview({
        cert_id: cert.id,
        subject_id: cert.id,
        event: 'issued',
        actor_name: cert.company_name,
        actor_org: '한국섬유산업연합회(섬산련)',
        actor_role: 'applicant',
        comment: `기존 인증 등록 · ${trimmedNo} · ${schemeLabel(scheme)} · 승인 트랙 ${tracks.join(', ')}`
      });

      router.push(`/cert?no=${encodeURIComponent(trimmedNo)}`);
    } catch (err: any) {
      console.error('[GoDPP] 인증 업체 등록 실패:', err);
      setError(err?.message || '등록 처리 중 오류가 발생했습니다.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      <Header currentRole="cert_auditor" />

      <div className="border-b border-white/5 bg-slate-950/60 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between text-xs">
          <button
            onClick={() => router.push('/cert')}
            className="text-slate-400 hover:text-white flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> 국산인증 홈
          </button>
          <span className="text-[11px] text-slate-500">인증 업체 등록</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 pt-6 space-y-5 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BadgeCheck className="w-6 h-6 text-emerald-400" />
            인증 업체 등록
          </h1>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            한국섬유산업연합회(섬산련)에서 <strong className="text-slate-200">이미 인증받은 업체</strong>를
            플랫폼에 등록합니다. 등록된 업체는 자사 제품에 인증마크를 발급·부착할 수 있습니다.
          </p>
          <p className="text-[11px] text-amber-300/90 mt-2 flex items-start gap-1.5 leading-relaxed">
            <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />
            kDPP는 인증기관이 아닙니다. 인증 심사·발급은 섬산련이 수행하며, 이 화면은 그 결과를 기록합니다.
          </p>
        </div>

        {/* 1. 섬산련 인증 정보 */}
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-black text-slate-100 flex items-center gap-2 mb-1">
            <ClipboardCheck className="w-4 h-4 text-emerald-400" />
            1. 섬산련 인증 정보
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            섬산련이 부여한 인증번호와 발급일을 그대로 입력합니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <label>
              <span className="text-[11px] font-bold text-slate-400 block mb-1">
                인증번호 <span className="text-rose-400">*</span>
              </span>
              <input
                required
                value={certNo}
                onChange={(e) => setCertNo(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono"
                placeholder="K-TEX-2026-0001"
              />
              {duplicateNo && (
                <span className="text-[10px] text-rose-400 mt-1 block">
                  이미 등록된 인증번호입니다.
                </span>
              )}
            </label>
            <label>
              <span className="text-[11px] font-bold text-slate-400 block mb-1">발급일</span>
              <input
                type="date"
                value={issuedAt}
                onChange={(e) => setIssuedAt(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                계약기간 2년이 자동 계산됩니다. 미입력 시 오늘 기준.
              </span>
            </label>
          </div>

          <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
            검증방식 (2024.10.17 개정 이원화)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setScheme('third_party')}
              className={`text-left px-4 py-3 rounded-xl border transition-all ${
                scheme === 'third_party'
                  ? 'bg-emerald-500/15 border-emerald-500/50'
                  : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <p className="text-xs font-black text-slate-100">제3자 인증</p>
              <p className="text-[11px] text-slate-400 mt-0.5">현장실사 → 인증서</p>
            </button>
            <button
              type="button"
              onClick={() => setScheme('self_declaration')}
              className={`text-left px-4 py-3 rounded-xl border transition-all ${
                scheme === 'self_declaration'
                  ? 'bg-amber-500/15 border-amber-500/50'
                  : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <p className="text-xs font-black text-slate-100">기업자율인증</p>
              <p className="text-[11px] text-slate-400 mt-0.5">자기적합성선언 → 확인서</p>
            </button>
          </div>
        </section>

        {/* 2. 업체 정보 */}
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-black text-slate-100 flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-emerald-400" />
            2. 업체 정보
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="sm:col-span-2">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">
                기업명 <span className="text-rose-400">*</span>
              </span>
              <input
                required
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                placeholder="예: (주)한빛학생복"
              />
              {duplicateCompany && (
                <span className="text-[10px] text-amber-400 mt-1 block">
                  같은 이름의 업체가 이미 등록되어 있습니다.
                </span>
              )}
            </label>
            <label>
              <span className="text-[11px] font-bold text-slate-400 block mb-1">사업자등록번호</span>
              <input
                value={company.bizNo}
                onChange={(e) => setCompany({ ...company, bizNo: e.target.value })}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono"
                placeholder="000-00-00000"
              />
            </label>
            <label>
              <span className="text-[11px] font-bold text-slate-400 block mb-1">대표자</span>
              <input
                value={company.representative}
                onChange={(e) => setCompany({ ...company, representative: e.target.value })}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">소재지</span>
              <input
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </label>
            <label className="sm:col-span-3">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">담당자 연락처</span>
              <input
                value={company.contact}
                onChange={(e) => setCompany({ ...company, contact: e.target.value })}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </label>
          </div>

          <div className="mt-4">
            <span className="text-[11px] font-bold text-slate-400 block mb-1.5">업종</span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_INDUSTRIES.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setIndustry(k)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    industry === k
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-700/60 hover:text-slate-200'
                  }`}
                >
                  {INDUSTRY_LABEL[k]}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 3. 인증 트랙 & 대상품목 */}
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-black text-slate-100 flex items-center gap-2 mb-1">
            <BadgeCheck className="w-4 h-4 text-emerald-400" />
            3. 인증 트랙 및 대상품목
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            섬산련이 승인한 트랙을 선택합니다. 이 범위 안에서만 제품에 마크를 발급할 수 있습니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            {ALL_TRACKS.map((t) => {
              const meta = trackMeta(t);
              const on = tracks.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggle(tracks, t, setTracks)}
                  className={`text-left px-3.5 py-3 rounded-xl border transition-all ${
                    on
                      ? 'bg-emerald-500/15 border-emerald-500/50'
                      : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <DomesticCertMark track={t} size="sm" showWordmark={false} />
                    <span className="text-xs font-black text-slate-100">{t}</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-200">{meta.en}</p>
                  <p className="text-[10px] text-slate-500 leading-snug mt-0.5">{meta.scope}</p>
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
            대상품목 (상표법 시행규칙 제28조 제1항 상품류)
          </span>
          <div className="space-y-1.5">
            {PRODUCT_CLASSES.map((c) => (
              <label
                key={c.v}
                className="flex items-center gap-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 px-3 py-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={classes.includes(c.v)}
                  onChange={() => toggle(classes, c.v, setClasses)}
                  className="w-3.5 h-3.5 accent-emerald-500"
                />
                <span className="text-[11px] text-slate-300">{c.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* 4. 생산 역량 */}
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-black text-slate-100 flex items-center gap-2 mb-1">
            <Factory className="w-4 h-4 text-emerald-400" />
            4. 생산시설 및 대표 품목
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            대표 품목을 연결하면 그 제품의 공정 이력이 등록 트랙과 맞는지 참고 판정을 보여줍니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <label>
              <span className="text-[11px] font-bold text-slate-400 block mb-1">공장명</span>
              <input
                value={factory.name}
                onChange={(e) => setFactory({ ...factory, name: e.target.value })}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </label>
            <label>
              <span className="text-[11px] font-bold text-slate-400 block mb-1">소재지</span>
              <input
                value={factory.location}
                onChange={(e) => setFactory({ ...factory, location: e.target.value })}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </label>
            <label>
              <span className="text-[11px] font-bold text-slate-400 block mb-1">담당 공정</span>
              <input
                value={factory.process}
                onChange={(e) => setFactory({ ...factory, process: e.target.value })}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                placeholder="예: 봉제"
              />
            </label>
          </div>

          <span className="text-[11px] font-bold text-slate-400 block mb-1.5">대표 품목</span>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {[
              ...fabrics.map((f) => ({ id: f.id, name: f.name })),
              ...passports.map((p) => ({ id: p.id, name: p.product_name }))
            ].map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 px-3 py-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={representativeIds.includes(item.id)}
                  onChange={() => toggle(representativeIds, item.id, setRepresentativeIds)}
                  className="w-3.5 h-3.5 accent-emerald-500 shrink-0"
                />
                <span className="text-[11px] text-slate-300 truncate">{item.name}</span>
                <span className="text-[10px] font-mono text-slate-500 ml-auto shrink-0">{item.id}</span>
              </label>
            ))}
          </div>

          {evidenceVerdicts.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {/* 적격성 심사 참고 자료 — 업체가 신청한 트랙을 실제 생산이 뒷받침하는지 본다.
                  개별 품목이 인증받는 것이 아니므로 이 판정은 제품 화면에 노출하지 않는다. */}
              <p className="text-[10px] text-slate-500 leading-relaxed">
                아래는 <strong className="text-slate-400">적격성 심사 참고 자료</strong>입니다. 대표 품목의
                공정 이력이 신청 트랙을 뒷받침하는지 보여줄 뿐, 개별 품목이 인증받는 것은 아닙니다.
              </p>
              {evidenceVerdicts.map((e) => (
                <div
                  key={e.id}
                  className={`rounded-lg border px-3 py-2 ${
                    e.verdict.eligible
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-slate-800/40 border-slate-600/40'
                  }`}
                >
                  <p className="text-[11px] font-bold text-slate-100">
                    {e.name} → {e.verdict.eligible ? `${e.verdict.track} ${e.verdict.markName}` : '판정 불가'}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-snug">{e.verdict.reason}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. 품질기준 */}
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-black text-slate-100 flex items-center gap-2 mb-1">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            5. 품질기준 (국가 강제 기준)
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            「전기용품 및 생활용품 안전관리법」상 유해물질 안전기준 충족 여부입니다.
          </p>

          <div className="space-y-2 mb-4">
            <label className="flex items-start gap-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 px-4 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={quality.esaArticle23}
                onChange={(e) => setQuality({ ...quality, esaArticle23: e.target.checked })}
                className="mt-0.5 w-4 h-4 accent-emerald-500"
              />
              <span className="text-[11px] text-slate-300 leading-relaxed">
                <strong className="text-slate-100">제23조</strong> 공급자적합성확인 등
              </span>
            </label>
            <label className="flex items-start gap-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 px-4 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={quality.esaArticle46}
                onChange={(e) => setQuality({ ...quality, esaArticle46: e.target.checked })}
                className="mt-0.5 w-4 h-4 accent-emerald-500"
              />
              <span className="text-[11px] text-slate-300 leading-relaxed">
                <strong className="text-slate-100">제46조</strong> 유해성평가 결과의 반영
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label>
              <span className="text-[11px] font-bold text-slate-400 block mb-1">시험성적서 번호</span>
              <input
                value={quality.reportNo ?? ''}
                onChange={(e) => setQuality({ ...quality, reportNo: e.target.value })}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono"
              />
            </label>
            <label>
              <span className="text-[11px] font-bold text-slate-400 block mb-1">발급일</span>
              <input
                type="date"
                value={quality.reportDate ?? ''}
                onChange={(e) => setQuality({ ...quality, reportDate: e.target.value })}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </label>
            <label>
              <span className="text-[11px] font-bold text-slate-400 block mb-1">시험기관</span>
              <input
                value={quality.testingLab ?? ''}
                onChange={(e) => setQuality({ ...quality, testingLab: e.target.value })}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </label>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="glass-panel rounded-2xl p-5 space-y-3">
          {!trimmedNo && (
            <p className="text-[11px] text-slate-400 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0 text-amber-400" />
              섬산련이 부여한 인증번호를 입력해야 합니다.
            </p>
          )}
          {tracks.length === 0 && (
            <p className="text-[11px] text-slate-400 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0 text-amber-400" />
              인증 트랙을 1개 이상 선택해야 합니다.
            </p>
          )}
          {!qualityOk && (
            <p className="text-[11px] text-slate-400 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0 text-amber-400" />
              품질기준(전안법 제23조·제46조) 두 항목에 모두 체크해야 합니다.
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            {submitting ? (
              '등록 중...'
            ) : (
              <>
                인증 업체 등록 <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          {tracks.length > 0 && trimmedNo && (
            <p className="text-[10px] text-slate-500 text-center">
              {trimmedNo} · {documentTitle(scheme)} · 승인 트랙 {tracks.join(', ')} · 계약기간 2년
            </p>
          )}
        </div>

        <p className="text-[10px] text-slate-500 text-center">
          등록된 업체를 확인하려면{' '}
          <Link href="/cert" className="text-emerald-400 hover:underline">
            국산인증 홈
          </Link>
          으로 이동하세요.
        </p>
      </form>
    </div>
  );
}
