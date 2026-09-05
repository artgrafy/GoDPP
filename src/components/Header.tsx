'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  QrCode,
  Layers,
  Shirt,
  ScanLine,
  BadgeCheck
} from 'lucide-react';
import { QRScannerModal } from './QRScannerModal';
import { BrandMark } from './BrandMark';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  currentRole?: string;
  onRoleChange?: (role: string) => void;
}

interface NavItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** 아이콘 대신 이미지를 쓰는 경우 (국산 섬유제품 인증마크) */
  iconSrc?: string;
  /** 활성 판정. 경로가 서로 접두사 관계인 경우를 정확히 구분한다. */
  match: (pathname: string) => boolean;
}

/**
 * 역할별 포털 네비게이션.
 *
 * '소비자'는 콘솔이 없다 — 제품 라벨의 QR을 스캔해 /p?id=... 로 바로 들어오는 것이
 * 실제 동선이고, 그 진입점은 우측 'QR 스캔 데모' 버튼이 담당한다.
 * 특정 제품 하나를 네비에 고정하면 그 제품이 '소비자 메뉴'인 것처럼 보여 오해를 준다.
 */
const NAV_ITEMS: NavItem[] = [
  {
    href: '/cert',
    label: '국산인증',
    // 섬산련 국산 섬유제품 인증마크 메인 SYMBOL
    iconSrc: '/marks/korea-mark-symbol.png',
    match: (p) => p === '/cert' || p === '/cert-register' || p === '/cert-review' || p === '/cert-mark'
  },
  {
    href: '/manufacturer',
    label: '패션 DPP',
    icon: QrCode,
    match: (p) => p === '/manufacturer'
  },
  {
    href: '/fabric-supplier',
    label: '원단 DPP',
    icon: Layers,
    // '/fabric'(원단 상세)과 '/fabric-supplier'를 모두 이 메뉴로 묶되,
    // startsWith('/fabric')만 쓰면 무관한 경로까지 활성화되므로 명시적으로 판정한다.
    match: (p) => p === '/fabric-supplier' || p === '/fabric' || p.startsWith('/fabric/')
  },
  {
    href: '/verifier',
    label: '검증·규제기관',
    icon: ShieldCheck,
    match: (p) => p === '/verifier'
  }
];

export const Header: React.FC<HeaderProps> = ({ currentRole = 'consumer', onRoleChange }) => {
  const pathname = usePathname();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const roles = [
    { id: 'consumer', name: '일반 소비자', icon: Shirt, badge: 'Public QR View' },
    { id: 'manufacturer', name: '패션 제조사', icon: QrCode, badge: 'DPP 발급' },
    { id: 'fabric_supplier', name: '원단 공급사', icon: Layers, badge: '소재 등록' },
    { id: 'cert_auditor', name: '인증 심사원', icon: BadgeCheck, badge: '국산인증 심사' },
    { id: 'verifier', name: '국가·검증기관', icon: ShieldCheck, badge: '심층 감사' },
  ];

  return (
    <>
      {/* 최상단 데모 안내 배너 */}
      <div className="w-full bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-sky-500/10 border-b border-white/5 py-1 px-4 text-center text-[11px] text-slate-300 flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1 font-bold text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          DEMO 환경
        </span>
        <span className="text-slate-600 hidden sm:inline">|</span>
        <span className="text-slate-400 text-[10.5px] sm:text-[11px]">
          EU ESPR 규제 대응 및 순환경제 실증을 위한 <strong>인터랙티브 데모 버전</strong>입니다. (실시간 시뮬레이션 지원)
        </span>
      </div>

      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 로고 & 슬로건 */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-3 group">
                {/* kDPP 자체 심볼. 섬산련 인증마크는 '인증을 표시하는 자리'에서만 쓴다 —
                    서비스 로고로 걸면 kDPP 가 인증기관인 것처럼 읽힌다. */}
                <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105">
                  <BrandMark size={36} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                      kDPP
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-md">
                      DEMO
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full hidden sm:inline-block">
                      ESPR Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 hidden sm:block">
                    디지털 제품 여권 & 순환경제 통합 플랫폼
                  </p>
                </div>
              </Link>

              {/* 주요 메뉴 */}
              <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-white/10 text-sm font-medium">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.match(pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {item.iconSrc ? (
                        // 마크는 흰 바탕에 인쇄되는 것이 원칙이라 다크 네비에서도 흰 칩 위에 올린다
                        <span className="w-4 h-4 shrink-0 rounded-[3px] paper flex items-center justify-center p-px">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.iconSrc} alt="" className="w-full h-full object-contain" />
                        </span>
                      ) : Icon ? (
                        <Icon className="w-4 h-4 shrink-0" />
                      ) : null}
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* 우측 빠른 시연 도구 & QR 카메라 스캐너 */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => setIsScannerOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                title="카메라 QR 스캔 또는 ID 입력"
              >
                <ScanLine className="w-4 h-4" />
                <span className="hidden sm:inline">QR 스캔 데모</span>
              </button>

              {/* 역할 스위처 드롭다운/버튼 (시연용) */}
              {onRoleChange && (
                <div className="flex items-center bg-slate-900 border border-white/10 rounded-lg p-1">
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const isActive = currentRole === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => onRoleChange(r.id)}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                        title={`${r.name} (${r.badge})`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">{r.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </>
  );
};
