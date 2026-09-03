'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ScanLine, ArrowRight, Shirt, Sparkles, Layers } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [customId, setCustomId] = useState('');

  if (!isOpen) return null;

  const handleNavigate = (id: string, isFabric = false) => {
    onClose();
    if (isFabric) {
      router.push(`/fabric/${id}`);
    } else {
      router.push(`/p/${id}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customId.trim()) return;
    const cleanId = customId.trim();
    if (cleanId.startsWith('FAB-')) {
      handleNavigate(cleanId, true);
    } else {
      handleNavigate(cleanId, false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 sm:p-8 border border-white/15 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <ScanLine className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">DPP QR 스캔 & 즉시 조회</h3>
            <p className="text-xs text-slate-400">스마트폰 카메라로 스캔하거나 ID를 입력하세요</p>
          </div>
        </div>

        {/* 카메라 뷰파인더 스타일 데모 애니메이션 */}
        <div className="relative w-full h-44 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 flex flex-col items-center justify-center overflow-hidden mb-6">
          <div className="absolute inset-x-8 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulseGlow"></div>
          
          <div className="w-28 h-28 border-2 border-dashed border-emerald-500/40 rounded-xl flex items-center justify-center relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-400"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-400"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-400"></div>
            <ScanLine className="w-8 h-8 text-emerald-400/80" />
          </div>

          <p className="text-xs text-slate-400 mt-3 font-medium">
            💡 스마트폰 카메라 앱으로도 즉시 스캔 가능합니다
          </p>
        </div>

        {/* 직접 ID 입력 폼 */}
        <form onSubmit={handleSubmit} className="mb-6">
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            DPP 식별자(ID) 직접 입력
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="예: DPP-2026-JKT-0042 또는 FAB-2026-ECO-0991"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              className="flex-1 glass-input px-4 py-2.5 rounded-xl text-sm placeholder-slate-500 font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              조회
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* 빠른 시연 프리셋 */}
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            빠른 시연 프리셋 (One-Click Demo)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => handleNavigate('DPP-2026-JKT-0042')}
              className="p-3 text-left rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-emerald-500/30 transition-all flex items-center gap-2.5 group"
            >
              <Shirt className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                  3L 에코 하드쉘 자켓
                </p>
                <p className="text-[10px] text-slate-400 font-mono">DPP-2026-JKT-0042</p>
              </div>
            </button>

            <button
              onClick={() => handleNavigate('DPP-2026-DNM-0188')}
              className="p-3 text-left rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-sky-500/30 transition-all flex items-center gap-2.5 group"
            >
              <Shirt className="w-4 h-4 text-sky-400 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors truncate">
                  서큘러 셀비지 데님
                </p>
                <p className="text-[10px] text-slate-400 font-mono">DPP-2026-DNM-0188</p>
              </div>
            </button>

            <button
              onClick={() => handleNavigate('FAB-2026-ECO-0991', true)}
              className="p-3 text-left rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-purple-500/30 transition-all flex items-center gap-2.5 group sm:col-span-2"
            >
              <Layers className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                  원단 DPP: 100% GRS 리사이클 립스탑 나일론
                </p>
                <p className="text-[10px] text-slate-400 font-mono">FAB-2026-ECO-0991 (Tier-2 소재)</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
