import React, { Suspense } from 'react';
import { PassportDetailClient } from '@/components/PassportDetailClient';
import { Sparkles } from 'lucide-react';

export default function PassportQueryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
          <Sparkles className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
          <p className="text-sm font-medium">디지털 제품 여권 데이터를 불러오는 중...</p>
        </div>
      }
    >
      <PassportDetailClient />
    </Suspense>
  );
}
