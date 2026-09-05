'use client';

import React from 'react';

/**
 * kDPP 브랜드 심볼.
 *
 * 🔴 섬산련 국산 섬유제품 인증마크를 서비스 로고로 쓰지 않는다.
 *    실제 인증기관의 마크를 헤더에 걸면 kDPP 가 그 인증기관이거나
 *    공식 발급 시스템인 것처럼 읽힌다. 인증마크는 인증을 표시하는 자리
 *    (/cert 계열, DomesticCertMark)에서만 쓴다.
 *
 * 도안: 순환(circularity)을 뜻하는 열린 고리 + 중심의 식별자 점.
 *   · 고리가 끊긴 자리에 화살촉 → 재순환되어 되돌아오는 흐름
 *   · 중심 점 = 제품에 부여된 고유 식별자(DPP ID)
 *   16px 파비콘에서도 고리와 점으로 읽히도록 형태를 단순하게 유지한다.
 */
interface BrandMarkProps {
  size?: number;
  /** 단색 렌더 (인쇄·모노 환경). 지정하면 그라디언트 대신 이 색을 쓴다. */
  mono?: string;
  className?: string;
  /** 그라디언트 id 충돌 방지 — 한 화면에 여러 개 놓을 때 */
  idSuffix?: string;
}

export function BrandMark({ size = 40, mono, className = '', idSuffix = '' }: BrandMarkProps) {
  const gid = `kdpp-grad${idSuffix}`;
  const stroke = mono ?? `url(#${gid})`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="kDPP"
      className={className}
    >
      {!mono && (
        <defs>
          <linearGradient id={gid} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--brand-1)" />
            <stop offset="0.55" stopColor="var(--brand-2)" />
            <stop offset="1" stopColor="var(--brand-3)" />
          </linearGradient>
        </defs>
      )}

      {/* 열린 고리 — 우상단이 끊겨 있다 */}
      <path
        d="M24.3 9.3A10.6 10.6 0 1 0 26.6 15.4"
        stroke={stroke}
        strokeWidth="3.2"
        strokeLinecap="butt"
      />
      {/* 화살촉 — 고리가 진행해 다시 이어지는 방향(위쪽)을 가리킨다 */}
      <path d="M26.6 8.4 30.4 15.6 22.8 15.6Z" fill={stroke} />
      {/* 중심 식별자 */}
      <circle cx="16" cy="16" r="4" fill={stroke} />
    </svg>
  );
}
