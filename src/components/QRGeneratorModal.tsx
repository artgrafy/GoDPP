'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, Check, X, Printer, ExternalLink, Sparkles } from 'lucide-react';
import { FashionDPP } from '@/types/dpp';

interface QRGeneratorModalProps {
  passport: FashionDPP;
  isOpen: boolean;
  onClose: () => void;
}

export const QRGeneratorModal: React.FC<QRGeneratorModalProps> = ({ passport, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [labelType, setLabelType] = useState<'hangtag' | 'carelabel'>('hangtag');

  if (!isOpen) return null;

  // 실제 QR 연결 URL (배포 도메인 dpp.using.ai.kr 기준)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dpp.using.ai.kr';
  const passportUrl = `${origin}/p/${passport.id}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(passportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl glass-panel rounded-2xl p-6 sm:p-8 border border-white/15 shadow-2xl">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">DPP QR 라벨 생성 및 인쇄</h3>
            <p className="text-xs text-slate-400">GS1 Digital Link 규격 호환 2D 데이터캐리어</p>
          </div>
        </div>

        {/* 라벨 타입 선택 */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-white/10 mb-6">
          <button
            onClick={() => setLabelType('hangtag')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              labelType === 'hangtag'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🏷️ 프리미엄 행택 (Hangtag)
          </button>
          <button
            onClick={() => setLabelType('carelabel')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              labelType === 'carelabel'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🧵 영구 부착 케어라벨 (Woven Label)
          </button>
        </div>

        {/* 라벨 시각화 프리뷰 */}
        <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-white/10 shadow-inner mb-6">
          {labelType === 'hangtag' ? (
            /* 행택 스타일 */
            <div className="w-72 bg-white text-slate-900 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center border-t-8 border-emerald-500 relative">
              <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-slate-100 absolute top-2 left-1/2 -translate-x-1/2"></div>
              <div className="mt-2 mb-1 text-[11px] font-bold uppercase tracking-widest text-emerald-700">
                EU Digital Product Passport
              </div>
              <h4 className="text-sm font-black text-slate-900 leading-tight mb-2 line-clamp-1">
                {passport.product_name}
              </h4>
              <p className="text-[10px] text-slate-500 mb-4 font-mono">{passport.id}</p>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm mb-3">
                <QRCodeSVG
                  value={passportUrl}
                  size={140}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <p className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 justify-center">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                카메라로 스캔하여 지속가능성 확인
              </p>
              <div className="w-full mt-3 pt-3 border-t border-slate-200 flex justify-between text-[10px] font-bold text-slate-600">
                <span>에코스코어 {passport.eco_scores.overallScore}점</span>
                <span>탄소 {passport.eco_scores.totalCarbonKg} kg</span>
              </div>
            </div>
          ) : (
            /* 케어라벨 스타일 */
            <div className="w-64 bg-slate-900 text-white rounded-xl p-5 border border-slate-700 shadow-xl flex flex-col items-center text-center font-mono">
              <div className="text-[10px] font-bold tracking-wider text-emerald-400 mb-1">
                CIRCULAR PASSPORT
              </div>
              <p className="text-[11px] font-bold text-white mb-2">{passport.brand_name}</p>
              <div className="p-2 bg-white rounded-lg mb-2">
                <QRCodeSVG
                  value={passportUrl}
                  size={120}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-[9px] text-slate-400">ID: {passport.id}</p>
              <p className="text-[9px] text-slate-400 mt-1">SCAN FOR RECYCLING & CARE</p>
            </div>
          )}
        </div>

        {/* 연결 URL 정보 및 액션 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-900/90 rounded-xl border border-white/10 text-xs font-mono">
            <span className="text-slate-400 truncate mr-2">{passportUrl}</span>
            <button
              onClick={handleCopyUrl}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-1 shrink-0 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '복사됨' : 'URL 복사'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={passportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-slate-300" />
              새 탭에서 소비자 뷰 열기
            </a>
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              라벨 인쇄 / PDF 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
