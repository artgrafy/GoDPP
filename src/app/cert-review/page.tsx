import React, { Suspense } from 'react';
import { Sparkles } from 'lucide-react';
import { CertReviewClient } from '@/components/cert/CertReviewClient';

export default function CertReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
          <Sparkles className="w-8 h-8 text-sky-400 animate-spin mb-3" />
          <p className="text-sm font-medium">인증 심사 큐를 불러오는 중...</p>
        </div>
      }
    >
      <CertReviewClient />
    </Suspense>
  );
}
