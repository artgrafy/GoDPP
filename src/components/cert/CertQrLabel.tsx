'use client';

import React from 'react';
import { Printer, X } from 'lucide-react';
import type { DomesticCertification, MarkIssue } from '@/types/domesticCert';
import { MARK_CARRIER_LABEL } from '@/types/domesticCert';
import { MarkArtwork, certQrUrl } from './MarkArtwork';

/**
 * 발급받은 마크의 인쇄 라벨.
 *
 * 🔴 QR 은 '업체 인증'으로 연결한다.
 *    마크는 업체 단위로 대량 인쇄되므로 같은 업체·같은 트랙의 마크는 전부 같은 QR을 갖는다.
 *    스캔하면 어느 업체가 어떤 트랙으로 인증받았는지가 나오는 것이 맞고,
 *    제품 단위 추적은 DPP QR이 따로 담당한다.
 *
 * 도안은 발급 화면 미리보기와 같은 MarkArtwork 를 쓴다 — 미리 본 것과 인쇄물이 어긋나지 않도록.
 */
interface CertQrLabelProps {
  /** 발급 이력 (트랙·형태·발급번호의 출처) */
  mark: MarkIssue;
  /** 마크를 발행받은 업체의 인증 */
  cert: DomesticCertification;
  isOpen: boolean;
  onClose: () => void;
}

export function CertQrLabel({ mark, cert, isOpen, onClose }: CertQrLabelProps) {
  if (!isOpen) return null;

  const carrier = mark.carrier ?? 'hangtag';
  const qrUrl = certQrUrl(cert);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="glass-panel rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto border border-white/10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 no-print">
          <div>
            <h3 className="text-sm font-black text-white">국산 인증마크 라벨 인쇄</h3>
            <p className="text-[11px] text-slate-400">
              {mark.mark_no} · {MARK_CARRIER_LABEL[carrier]} · {cert.company_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* 발급 시 지정된 형태 그대로 인쇄한다 */}
          <div className="flex justify-center">
            <MarkArtwork
              track={mark.track}
              carrier={carrier}
              cert={cert}
              markNo={mark.mark_no}
              qrUrl={qrUrl}
              size="print"
              className="print-target"
            />
          </div>

          <p className="text-[10px] text-slate-500 text-center no-print leading-relaxed">
            QR 스캔 시 <span className="font-mono text-slate-400">{qrUrl}</span> 로 이동해 누구나 업체의
            인증 진위를 확인할 수 있습니다. 같은 업체·같은 트랙의 마크는 모두 같은 QR을 갖습니다.
          </p>

          <button
            onClick={() => window.print()}
            className="no-print w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" /> 라벨 인쇄
          </button>
        </div>
      </div>
    </div>
  );
}
