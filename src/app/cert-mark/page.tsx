import React, { Suspense } from 'react';
import { Sparkles } from 'lucide-react';
import { CertMarkClient } from '@/components/cert/CertMarkClient';

export default function CertMarkPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
          <Sparkles className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
          <p className="text-sm font-medium">마크 발급 정보를 준비하는 중...</p>
        </div>
      }
    >
      <CertMarkClient />
    </Suspense>
  );
}
