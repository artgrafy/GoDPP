'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { X, ScanLine, ArrowRight, Shirt, Layers, BadgeCheck, Smartphone } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * QR 스캔 체험 모달.
 *
 * 실제로 스캔되는 QR 을 화면에 띄운다 — 휴대폰 카메라로 이 화면을 비추면 그대로 열린다.
 * 카메라 뷰파인더 애니메이션은 두지 않았다. 이 앱은 카메라로 읽지 않으므로
 * 스캔하는 것처럼 보이는 연출은 없는 기능을 있는 것처럼 보이게 한다.
 *
 * 두 QR 의 성격이 다르다는 점이 이 화면의 핵심이다.
 *   · 패션 DPP QR  → 제품 1건의 여권 (제품마다 다르다)
 *   · 국산인증 QR  → 업체의 인증 (같은 업체·트랙의 마크는 전부 같은 QR)
 */

type DemoKey = 'dpp' | 'cert';

const DEMOS: Record<
  DemoKey,
  {
    label: string;
    icon: typeof Shirt;
    accent: string;
    path: string;
    title: string;
    code: string;
    desc: string;
  }
> = {
  dpp: {
    label: '패션 DPP',
    icon: Shirt,
    accent: 'emerald',
    path: '/p?id=DPP-2026-JKT-0042',
    title: '아크테라 3L 에코 하드쉘 자켓',
    code: 'DPP-2026-JKT-0042',
    desc: '제품 1건의 디지털 제품 여권입니다. 소재 구성, 탄소발자국, 공급망 이력, 세탁·수선 가이드를 소비자 화면으로 보여줍니다. 제품마다 QR이 다릅니다.'
  },
  cert: {
    label: '국산인증',
    icon: BadgeCheck,
    accent: 'emerald',
    path: '/cert?no=K-TEX-2026-D002',
    title: 'ARCTERA Sustainability · T1 · T3',
    code: 'K-TEX-2026-D002',
    desc: '제품에 부착된 국산 인증마크의 QR입니다. 마크는 업체에 발행되므로 스캔하면 업체의 인증 내용(승인 트랙·계약기간·심사 이력)이 나옵니다. 같은 업체·같은 트랙의 마크는 모두 같은 QR입니다.'
  }
};

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [customId, setCustomId] = useState('');
  const [tab, setTab] = useState<DemoKey>('dpp');

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dpp.using.ai.kr';
  const demo = DEMOS[tab];
  const demoUrl = `${origin}${demo.path}`;

  const go = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = customId.trim();
    if (!cleanId) return;
    const upper = cleanId.toUpperCase();

    // 마크 발급번호(KTM-) / 업체 인증번호(K-TEX-) / 신청번호(APP-)는 인증 문서 화면으로 보낸다.
    if (upper.startsWith('KTM-')) return go(`/cert?mark=${encodeURIComponent(cleanId)}`);
    if (upper.startsWith('K-TEX-')) return go(`/cert?no=${encodeURIComponent(cleanId)}`);
    if (upper.startsWith('APP-')) return go(`/cert?id=${encodeURIComponent(cleanId)}`);
    if (upper.startsWith('FAB-')) return go(`/fabric?id=${encodeURIComponent(cleanId)}`);
    return go(`/p?id=${encodeURIComponent(cleanId)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto glass-panel rounded-2xl p-6 sm:p-7 border border-white/15 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <ScanLine className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">QR 스캔 체험</h3>
            <p className="text-xs text-slate-400">
              휴대폰 카메라로 아래 QR을 비추면 그대로 열립니다
            </p>
          </div>
        </div>

        {/* 두 종류의 QR — 성격이 다르다 */}
        <div className="flex gap-2 mb-4">
          {(Object.keys(DEMOS) as DemoKey[]).map((k) => {
            const Icon = DEMOS[k].icon;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                  tab === k
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {DEMOS[k].label} QR
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-5 mb-5">
          <div className="flex justify-center mb-4">
            <div className="paper rounded-xl p-3.5 shadow-lg">
              <QRCodeSVG value={demoUrl} size={168} level="M" includeMargin={false} />
            </div>
          </div>

          <p className="text-sm font-bold text-white text-center">{demo.title}</p>
          <p className="text-[10px] font-mono text-slate-400 text-center mt-0.5">{demo.code}</p>
          <p className="text-[11px] text-slate-400 leading-relaxed mt-3">{demo.desc}</p>

          <div className="mt-4 pt-4 border-t border-white/5 space-y-2.5">
            <p className="text-[10px] font-mono text-slate-500 break-all text-center">{demoUrl}</p>
            <button
              onClick={() => go(demo.path)}
              className="w-full px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Smartphone className="w-4 h-4" />
              이 기기에서 바로 열기
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 다른 데모 */}
        <div className="mb-5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            다른 데모
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => go('/p?id=DPP-2026-DNM-0188')}
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
              onClick={() => go('/fabric?id=FAB-2026-ECO-0991')}
              className="p-3 text-left rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-purple-500/30 transition-all flex items-center gap-2.5 group"
            >
              <Layers className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                  원단 DPP (Tier-2)
                </p>
                <p className="text-[10px] text-slate-400 font-mono">FAB-2026-ECO-0991</p>
              </div>
            </button>
          </div>
        </div>

        {/* 직접 입력 */}
        <form onSubmit={handleSubmit}>
          <label className="block text-[11px] font-semibold text-slate-300 mb-2">
            DPP 식별자(ID) 또는 국산 인증/마크 번호 직접 입력
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="예: DPP-2026-JKT-0042 · FAB-2026-ECO-0991 · KTM-2026-D0003"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              className="flex-1 glass-input px-4 py-2.5 rounded-xl text-sm placeholder-slate-500 font-mono min-w-0"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all shrink-0"
            >
              조회
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
