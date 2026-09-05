import React, { Suspense } from 'react';
import { Sparkles } from 'lucide-react';
import { CertDocumentClient } from '@/components/cert/CertDocumentClient';

export default function CertPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
          <Sparkles className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
          <p className="text-sm font-medium">국산 섬유제품 인증 정보를 불러오는 중...</p>
        </div>
      }
    >
      <CertDocumentClient />
    </Suspense>
  );
}
