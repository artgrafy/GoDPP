'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, 
  QrCode, 
  Layers, 
  Shirt, 
  FileCheck, 
  Sparkles, 
  ScanLine,
  Database,
  ExternalLink
} from 'lucide-react';
import { QRScannerModal } from './QRScannerModal';

interface HeaderProps {
  currentRole?: string;
  onRoleChange?: (role: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRole = 'consumer', onRoleChange }) => {
  const pathname = usePathname();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const roles = [
    { id: 'consumer', name: '일반 소비자', icon: Shirt, badge: 'Public QR View' },
    { id: 'manufacturer', name: '패션 제조사', icon: QrCode, badge: 'DPP 발급' },
    { id: 'fabric_supplier', name: '원단 공급사', icon: Layers, badge: '소재 등록' },
    { id: 'verifier', name: '국가·검증기관', icon: ShieldCheck, badge: '심층 감사' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 로고 & 슬로건 */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-500 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                      GoDPP
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
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
                <Link
                  href="/p?id=DPP-2026-JKT-0042"
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    pathname.startsWith('/p')
                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Shirt className="w-4 h-4" />
                  소비자 여권
                </Link>
                <Link
                  href="/manufacturer"
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    pathname === '/manufacturer'
                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  패션 제조사
                </Link>
                <Link
                  href="/fabric-supplier"
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    pathname.startsWith('/fabric')
                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  원단 업체
                </Link>
                <Link
                  href="/verifier"
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    pathname === '/verifier'
                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  검증·규제기관
                </Link>
              </nav>
            </div>

            {/* 우측 빠른 시연 도구 & QR 카메라 스캐너 */}
            <div className="flex items-center gap-3">
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
