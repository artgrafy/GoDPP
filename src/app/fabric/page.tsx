import React, { Suspense } from 'react';
import { FabricDetailClient } from '@/components/FabricDetailClient';
import { Sparkles } from 'lucide-react';

export default function FabricQueryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
          <Sparkles className="w-8 h-8 text-purple-400 animate-spin mb-3" />
          <p className="text-sm font-medium">원단 DPP 데이터를 불러오는 중...</p>
        </div>
      }
    >
      <FabricDetailClient />
    </Suspense>
  );
}
