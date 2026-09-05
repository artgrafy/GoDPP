import React, { Suspense } from 'react';
import { Sparkles } from 'lucide-react';
import { CertRegisterClient } from '@/components/cert/CertRegisterClient';

export default function CertRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
          <Sparkles className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
          <p className="text-sm font-medium">인증 업체 등록 정보를 준비하는 중...</p>
        </div>
      }
    >
      <CertRegisterClient />
    </Suspense>
  );
}
