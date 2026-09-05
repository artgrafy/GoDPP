'use client';

import React from 'react';
import type { DomesticTrack } from '@/types/domesticCert';
import { trackMeta } from '@/lib/domesticCert';

interface DomesticCertMarkProps {
  track: DomesticTrack;
  size?: 'sm' | 'md' | 'lg' | 'print';
  /** lg/print에서 마크 아래 번호 각인 */
  certNo?: string | null;
  /** 트랙명 텍스트 병기 여부 */
  showWordmark?: boolean;
  /** 흑백 인쇄용 (그레이스케일) */
  monochrome?: boolean;
  className?: string;
}

/**
 * 국산 섬유제품 인증마크.
 *
 * 한국섬유산업연합회가 실제 운영하는 마크를 사용한다
 * (원본: raw/국산섬유제품인증마크.png → public/marks/).
 *   트랙1 KOREA PRODUCT      (원단 → 완제품)
 *   트랙2 KOREA TEXTILE      (원사 → 원단)
 *   트랙3 KOREA PRODUCT PLUS (원사 → 완제품, Yarn Forward)
 *
 * 마크는 흰 바탕에 인쇄되는 것이 원칙이므로 다크 UI 위에서도 흰 카드 위에 올린다.
 *
 * 🔴 실제 운영 중인 마크이므로 도안 위에 어떤 표식도 덧그리지 않는다.
 *    마크가 갈리는 축은 트랙(T1/T2/T3)과 전달 형태(지류·띠지·QR)뿐이다.
 *    인증방식(제3자 인증 / 기업자율인증)은 문서 이름(인증서 / 확인서)으로 구분되며
 *    도안에는 반영되지 않는다 — 마크 바깥 텍스트·배지로만 표시할 것.
 *    (자율인증에 'SD' 배지를 덧붙였다가 제거함: 제도에 없는 표기였다.)
 */

const MARK_SRC: Record<DomesticTrack, string> = {
  T1: '/marks/korea-mark-t1.png',
  T2: '/marks/korea-mark-t2.png',
  T3: '/marks/korea-mark-t3.png'
};

/** 마크 높이(px). 원본 비율(대략 165:250)에 맞춰 폭은 auto */
const PX: Record<NonNullable<DomesticCertMarkProps['size']>, number> = {
  sm: 30,
  md: 56,
  lg: 104,
  print: 150
};

export function DomesticCertMark({
  track,
  size = 'md',
  certNo,
  showWordmark = true,
  monochrome = false,
  className = ''
}: DomesticCertMarkProps) {
  const h = PX[size];
  const meta = trackMeta(track);
  // sm은 공간이 없어 트랙명 텍스트를 생략한다 (마크 안에 워드마크가 이미 들어 있다)
  const withWordmark = showWordmark && size !== 'sm';
  const withNotice = size === 'lg' || size === 'print';
  const pad = size === 'sm' ? 'p-1' : size === 'md' ? 'p-1.5' : 'p-2.5';

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className={`relative paper rounded-lg ${pad} shadow-sm shrink-0`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MARK_SRC[track]}
          alt={`${track} ${meta.en} 국산 섬유제품 인증마크`}
          title={`${meta.en} — ${meta.scope}`}
          style={{ height: h, width: 'auto' }}
          className={monochrome ? 'grayscale' : undefined}
        />
      </div>

      {withWordmark && (
        <div className="mt-1.5 text-center leading-tight">
          <div
            className={`font-black tracking-tight ${
              size === 'print' ? 'text-[11px]' : 'text-[10px]'
            } ${monochrome ? 'text-slate-900' : 'text-slate-100'}`}
          >
            {track} · {meta.ko}
          </div>
        </div>
      )}

      {withNotice && certNo && (
        <div
          className={`mt-1 font-mono ${size === 'print' ? 'text-[11px]' : 'text-[10px]'} ${
            monochrome ? 'text-slate-900' : 'text-slate-300'
          }`}
        >
          {certNo}
        </div>
      )}

      {withNotice && (
        <div
          className={`mt-1 max-w-[180px] text-center leading-snug ${
            size === 'print' ? 'text-[8px]' : 'text-[7px]'
          } ${monochrome ? 'text-slate-500' : 'text-slate-500'}`}
        >
          kDPP 데모 환경 표시 · 실제 발급 인증이 아닙니다
        </div>
      )}
    </div>
  );
}
