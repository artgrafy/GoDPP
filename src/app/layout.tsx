import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GoDPP (Demo) - 디지털 제품 여권 & 순환경제 통합 플랫폼',
  description: 'EU ESPR 및 CIRPASS 표준 기반 패션 의류 및 원단(소재) 디지털 제품 여권(DPP) 데모 플랫폼. 공급망 추적, LCA 탄소발자국, QR 라벨 발급.',
  metadataBase: new URL('https://dpp.using.ai.kr'),
  openGraph: {
    title: 'GoDPP (Demo) - 디지털 제품 여권 플랫폼',
    description: '패션 및 원단 공급망 투명성과 친환경 규제 준수를 위한 디지털 여권 솔루션 데모',
    url: 'https://dpp.using.ai.kr',
    siteName: 'GoDPP',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950 flex flex-col justify-between">
        <main className="flex-1">{children}</main>
        
        <footer className="w-full border-t border-white/10 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300">GoDPP Platform</span>
              <span className="px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">DEMO VERSION</span>
              <span>•</span>
              <span>dpp.using.ai.kr</span>
            </div>
            <p>
              EU ESPR / CIRPASS Architecture & GS1 Digital Link Demonstration
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
