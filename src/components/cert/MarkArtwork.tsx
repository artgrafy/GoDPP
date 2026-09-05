'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { DomesticCertification, MarkCarrier, DomesticTrack } from '@/types/domesticCert';
import { documentTitle, schemeLabel, trackMeta } from '@/lib/domesticCert';
import { DomesticCertMark } from './DomesticCertMark';

/**
 * 인증마크 라벨 도안 — 발급 화면의 미리보기와 인쇄 라벨이 같은 것을 쓴다.
 *
 * 형태(carrier)는 2024.10.17 운영규정 개정으로 확대된 세 가지다.
 *   hangtag 지류 행택 / band 띠지 / qr QR코드
 *
 * QR 은 항상 '업체 인증'을 가리킨다. 마크는 업체 단위로 대량 인쇄되므로
 * 같은 업체·같은 트랙의 마크는 전부 같은 QR을 갖는다.
 */
interface MarkArtworkProps {
  track: DomesticTrack;
  carrier: MarkCarrier;
  cert: DomesticCertification;
  /** 발급 전 미리보기에서는 아직 번호가 없다 */
  markNo?: string | null;
  qrUrl: string;
  /** print = 실제 인쇄 크기, thumb = 형태 선택용 축소판 */
  size?: 'print' | 'thumb';
  className?: string;
}

/** 크기별 치수. CSS 축소(transform/zoom) 대신 값을 나눠 둔다 — 축소하면 QR·소자가 뭉갠다. */
const D = {
  print: {
    hangtagW: 'w-[260px]', hangtagPad: 'p-5', markSize: 'print' as const,
    bandW: 'w-[300px]', bandPad: 'px-4 py-3', bandQr: 72,
    qrW: 'w-[200px]', qrPad: 'p-4', qrQr: 150,
    hangtagQr: 140, gap: 'gap-2'
  },
  thumb: {
    hangtagW: 'w-[136px]', hangtagPad: 'p-2.5', markSize: 'md' as const,
    bandW: 'w-[168px]', bandPad: 'px-2.5 py-2', bandQr: 40,
    qrW: 'w-[112px]', qrPad: 'p-2.5', qrQr: 76,
    hangtagQr: 68, gap: 'gap-1'
  }
};

export function MarkArtwork({
  track,
  carrier,
  cert,
  markNo,
  qrUrl,
  size = 'print',
  className = ''
}: MarkArtworkProps) {
  const d = D[size];
  const thumb = size === 'thumb';
  const validity = cert.valid_until
    ? `${new Date(cert.valid_until).toLocaleDateString('ko-KR')}까지`
    : null;
  const no = markNo ?? '발급 시 부여';

  if (carrier === 'hangtag') {
    return (
      <div
        className={`paper rounded-lg ${d.hangtagPad} ${d.hangtagW} border-t-4 border-emerald-500 shadow-xl ${className}`}
      >
        <div className={`flex flex-col items-center ${d.gap}`}>
          <DomesticCertMark track={track} size={d.markSize} certNo={thumb ? null : markNo} monochrome />
          <div className="w-full border-t border-slate-300 pt-2 flex justify-center">
            <QRCodeSVG value={qrUrl} size={d.hangtagQr} level="H" includeMargin />
          </div>
          <p className={`${thumb ? 'text-[7px]' : 'text-[10px]'} font-bold text-center leading-tight`}>
            {documentTitle(cert.scheme)}
            {!thumb && ` · ${schemeLabel(cert.scheme)}`}
          </p>
          <p
            className={`${thumb ? 'text-[6px]' : 'text-[9px]'} text-slate-600 text-center leading-tight`}
          >
            {cert.company_name}
          </p>
          <p
            className={`${thumb ? 'text-[6px]' : 'text-[8px]'} font-mono text-slate-500 text-center leading-tight`}
          >
            {cert.cert_no}
          </p>
          {validity && !thumb && <p className="text-[9px] text-slate-600">유효기간 {validity}</p>}
        </div>
      </div>
    );
  }

  if (carrier === 'band') {
    return (
      <div
        className={`paper rounded-md ${d.bandPad} ${d.bandW} border border-slate-300 shadow-xl ${className}`}
      >
        <div className={`flex items-center ${thumb ? 'gap-2' : 'gap-3'}`}>
          <QRCodeSVG value={qrUrl} size={d.bandQr} level="M" />
          <div className="min-w-0 flex-1">
            <p className={`${thumb ? 'text-[7px]' : 'text-[11px]'} font-black leading-tight`}>
              {trackMeta(track).en}
            </p>
            <p className={`${thumb ? 'text-[6px]' : 'text-[9px]'} font-mono text-slate-700`}>{no}</p>
            <p
              className={`${thumb ? 'text-[6px]' : 'text-[8px]'} text-slate-600 leading-tight mt-0.5 truncate`}
            >
              {cert.company_name}
              {!thumb && ` · ${documentTitle(cert.scheme)}`}
              {!thumb && validity ? ` · ${validity}` : ''}
            </p>
            {!thumb && (
              <p className="text-[7px] text-slate-500 mt-1 leading-tight">
                kDPP 데모 환경 · 실제 발급 인증 아님
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // qr — 마크 도안 없이 QR만 싣는 형태
  return (
    <div
      className={`paper rounded-lg ${d.qrPad} ${d.qrW} border border-slate-300 shadow-xl ${className}`}
    >
      <div className={`flex flex-col items-center ${d.gap}`}>
        <QRCodeSVG value={qrUrl} size={d.qrQr} level="H" includeMargin />
        <p className={`${thumb ? 'text-[7px]' : 'text-[10px]'} font-black leading-tight text-center`}>
          {track} {trackMeta(track).en}
        </p>
        <p className={`${thumb ? 'text-[6px]' : 'text-[8px]'} font-mono text-slate-600`}>{no}</p>
        {!thumb && (
          <p className="text-[7px] text-slate-500 text-center leading-tight">
            kDPP 데모 환경 · 실제 발급 인증 아님
          </p>
        )}
      </div>
    </div>
  );
}

/** 마크 QR 이 가리킬 업체 인증 URL */
export function certQrUrl(cert: DomesticCertification): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dpp.using.ai.kr';
  return cert.cert_no
    ? `${origin}/cert?no=${encodeURIComponent(cert.cert_no)}`
    : `${origin}/cert?id=${encodeURIComponent(cert.id)}`;
}
