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
  Printer,
  Sparkles
} from 'lucide-react';
import { Header } from '@/components/Header';
import { DomesticCertMark } from '@/components/cert/DomesticCertMark';
import { MarkArtwork, certQrUrl } from '@/components/cert/MarkArtwork';
import type { DomesticCertification, DomesticTrack, MarkCarrier, MarkIssue } from '@/types/domesticCert';
import { INDUSTRY_LABEL, MARK_CARRIER_LABEL } from '@/types/domesticCert';
import { canIssueMark, schemeLabel, trackMeta } from '@/lib/domesticCert';
import { newMarkId, reserveMarkNo } from '@/lib/certNumber';
import { appendCertReview, getActiveCertifications, saveMarkIssue } from '@/lib/supabase';

/**
 * 마크 발급 — 업체 단위.
 *
 * 🔴 제품을 고르지 않는다. 마크는 인증기업에게 트랙별로 발행되고
 *    업체가 매수 단위로 받아 자사 제품에 부착한다.
 *    "진행절차: … → 계약체결 → 마크발급 신청", "발급현황(천매/년)"
 */

const PRINTERS = [
  '섬산련 지정 인쇄소 (대구)',
  '섬산련 지정 인쇄소 (부산)',
  '섬산련 지정 인쇄소 (서울)'
];

const CARRIERS: Array<{ key: MarkCarrier; note: string }> = [
  { key: 'hangtag', note: '제품에 다는 지류 행택' },
  { key: 'band', note: '제품을 감싸는 띠지' },
  { key: 'qr', note: '2024.10.17 개정으로 추가' }
];

export function CertMarkClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramCert = searchParams?.get('cert') ?? null;

  const [certs, setCerts] = useState<DomesticCertification[]>([]);
  const [certId, setCertId] = useState(paramCert ? decodeURIComponent(paramCert).trim() : '');
  const [track, setTrack] = useState<DomesticTrack | ''>('');
  const [carrier, setCarrier] = useState<MarkCarrier>('hangtag');
  const [quantity, setQuantity] = useState(10000);
  const [printer, setPrinter] = useState(PRINTERS[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const c = await getActiveCertifications();
        if (alive) setCerts(c);
      } catch (err) {
        console.error('[GoDPP] 인증기업 목록 로딩 실패:', err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const selectedCert = useMemo(() => certs.find((c) => c.id === certId) ?? null, [certs, certId]);

  // 업체를 바꾸면 이전 트랙 선택이 남지 않도록 초기화한다.
  useEffect(() => {
    setTrack((prev) =>
      prev && selectedCert?.approved_tracks?.includes(prev) ? prev : ''
    );
  }, [selectedCert]);

  // 형태 미리보기용 — 트랙 미선택 시 승인 트랙 중 첫 번째로 형태만 먼저 보여준다.
  const previewCert = selectedCert;
  const previewTrack: DomesticTrack | null =
    (track || selectedCert?.approved_tracks?.[0]) ?? null;
  const previewUrl = previewCert ? certQrUrl(previewCert) : '';

  const gate = selectedCert && track ? canIssueMark(selectedCert, track) : null;
  const canSubmit = Boolean(selectedCert) && Boolean(track) && gate?.ok === true && quantity > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedCert || !track) return;
    setSubmitting(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const markNo = await reserveMarkNo(new Date().getFullYear());

      const mark: MarkIssue = {
        id: newMarkId(),
        mark_no: markNo,
        cert_id: selectedCert.id,
        track,
        carrier,
        quantity: Number(quantity),
        printer,
        status: 'issued',
        issued_at: now,
        created_at: now,
        updated_at: now
      };

      await saveMarkIssue(mark);
      await appendCertReview({
        cert_id: selectedCert.id,
        subject_id: selectedCert.id,
        event: 'mark_issued',
        actor_name: selectedCert.company_name,
        actor_org: '한국섬유산업연합회(섬산련)',
        actor_role: 'applicant',
        comment: `${track} 마크 발급 ${markNo} · ${MARK_CARRIER_LABEL[carrier]} · ${Number(quantity).toLocaleString()}매`,
        payload: { mark_no: markNo, track, carrier, quantity: Number(quantity) }
      });

      // 마크는 업체 인증을 가리킨다 — 발급 후에도 업체 인증 문서로 돌아간다.
      router.push(
        selectedCert.cert_no
          ? `/cert?no=${encodeURIComponent(selectedCert.cert_no)}`
          : `/cert?id=${encodeURIComponent(selectedCert.id)}`
      );
    } catch (err: any) {
      console.error('[GoDPP] 마크 발급 실패:', err);
      setError(err?.message || '발급 처리 중 오류가 발생했습니다.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Sparkles className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-sm font-medium">인증기업 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      <Header />

      <div className="border-b border-white/5 bg-slate-950/60 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between text-xs">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-white flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> 뒤로
          </button>
          <Link href="/cert" className="text-slate-400 hover:text-emerald-300 font-medium">
            인증 업체 목록
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 pt-6 space-y-5 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BadgeCheck className="w-6 h-6 text-emerald-400" />
            인증마크 발급
          </h1>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            마크는 계약을 체결한 <strong className="text-slate-200">인증기업</strong>에게 트랙별로 발행됩니다.
            업체가 발급받은 마크를 자사 제품에 부착하므로, 제품을 지정하지 않습니다.
          </p>
        </div>

        {/* 1. 인증기업 */}
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-black text-slate-100 flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-emerald-400" />
            1. 인증기업 선택
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            계약이 유효한 인증기업만 표시됩니다.
          </p>

          {certs.length === 0 ? (
            <div className="rounded-xl border border-slate-600/40 bg-slate-800/40 px-4 py-4 text-center">
              <p className="text-xs text-slate-300 font-bold">계약이 유효한 인증기업이 없습니다.</p>
              <Link href="/cert" className="text-[11px] text-emerald-400 hover:underline mt-2 inline-block">
                인증 업체 목록 보기 →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {certs.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCertId(c.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    certId === c.id
                      ? 'bg-emerald-500/15 border-emerald-500/50'
                      : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-100">{c.company_name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {c.industry ? INDUSTRY_LABEL[c.industry] : '—'} · {schemeLabel(c.scheme)}
                        {c.cert_no && ` · ${c.cert_no}`}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-300 shrink-0">
                      승인 트랙 {c.approved_tracks.join(', ')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 2. 트랙 */}
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-black text-slate-100 mb-1">2. 발급 트랙</h2>
          <p className="text-[11px] text-slate-500 mb-4">
            업체가 심사받아 승인된 트랙만 발급할 수 있습니다. 트랙별로 발급번호가 따로 부여됩니다.
          </p>

          {!selectedCert ? (
            <p className="text-[11px] text-slate-500">업체를 먼저 선택하세요.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {selectedCert.approved_tracks.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTrack(t)}
                  className={`px-3 py-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    track === t
                      ? 'bg-emerald-500/15 border-emerald-500/50'
                      : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <DomesticCertMark track={t} size="sm" showWordmark={false} />
                  <span className="text-[10px] font-black text-slate-100">{t}</span>
                  <span className="text-[9px] text-slate-500 text-center leading-tight">
                    {trackMeta(t).en}
                  </span>
                </button>
              ))}
            </div>
          )}

          {gate && !gate.ok && (
            <p className="text-[11px] text-amber-300 mt-3 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />
              {gate.reason}
            </p>
          )}
        </section>

        {/* 3. 형태 · 매수 · 인쇄소 */}
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-black text-slate-100 flex items-center gap-2 mb-1">
            <Printer className="w-4 h-4 text-emerald-400" />
            3. 마크 형태 및 발급 매수
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            인증기관이 발급번호를 부여하면 지정 인쇄소에서 마크를 인쇄합니다.
          </p>

          {/* 형태는 설명이 아니라 실제 도안으로 고른다. 아래 축소판은 인쇄될 라벨과 같은 도안이다. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            {CARRIERS.map(({ key, note }) => (
              <button
                key={key}
                type="button"
                onClick={() => setCarrier(key)}
                className={`px-3 py-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  carrier === key
                    ? 'bg-emerald-500/15 border-emerald-500/50'
                    : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className="min-h-[104px] flex items-center justify-center">
                  {previewCert && previewTrack ? (
                    <MarkArtwork
                      track={previewTrack}
                      carrier={key}
                      cert={previewCert}
                      markNo={null}
                      qrUrl={previewUrl}
                      size="thumb"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-500">업체·트랙 선택 후 표시</span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-bold text-slate-100">{MARK_CARRIER_LABEL[key]}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{note}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label>
              <span className="text-[11px] font-bold text-slate-400 block mb-1">발급 매수</span>
              {/* step 은 min 을 기준으로 검증된다 — min=1, step=1000 이면 10,000 이 무효값이 되어
                  브라우저가 폼 제출을 조용히 막는다. 발급 매수는 임의 정수여야 하므로 step=1. */}
              <input
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono"
              />
            </label>
            <label>
              <span className="text-[11px] font-bold text-slate-400 block mb-1">지정 인쇄소</span>
              <select
                value={printer}
                onChange={(e) => setPrinter(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              >
                {PRINTERS.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* 발급 직전 최종 확인 — 인쇄 라벨과 동일한 도안·크기 */}
        {selectedCert && track && (
          <section className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-black text-slate-100 mb-1">발급될 마크</h2>
            <p className="text-[11px] text-slate-500 mb-4">
              실제 인쇄 크기입니다. QR은 업체 인증({selectedCert.cert_no ?? selectedCert.id})으로
              연결되며, 발급번호는 제출 시 부여됩니다.
            </p>
            <div className="flex justify-center py-2">
              <MarkArtwork
                track={track}
                carrier={carrier}
                cert={selectedCert}
                markNo={null}
                qrUrl={certQrUrl(selectedCert)}
                size="print"
              />
            </div>
          </section>
        )}

        <div className="glass-panel rounded-2xl p-5">
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            {submitting ? '발급 중...' : <>인증마크 발급 <ArrowRight className="w-4 h-4" /></>}
          </button>
          {selectedCert && track && (
            <p className="text-[10px] text-slate-500 text-center mt-2">
              {selectedCert.company_name} · {track} {trackMeta(track).en} ·{' '}
              {MARK_CARRIER_LABEL[carrier]} · {Number(quantity).toLocaleString()}매
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
