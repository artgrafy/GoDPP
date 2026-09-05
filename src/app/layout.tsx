import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'kDPP (Demo) - 디지털 제품 여권 & 순환경제 통합 플랫폼',
  description: 'EU ESPR 및 CIRPASS 표준 기반 패션 의류 및 원단(소재) 디지털 제품 여권(DPP) 데모 플랫폼. 공급망 추적, LCA 탄소발자국, QR 라벨 발급.',
  metadataBase: new URL('https://dpp.using.ai.kr'),
  // 파비콘: kDPP 자체 심볼 (src/components/BrandMark.tsx 와 같은 도안).
  // 섬산련 인증마크는 서비스 아이콘으로 쓰지 않는다 — 인증기관으로 오인될 수 있다.
  // app/icon.png · app/apple-icon.png 파일 규약으로도 주입되지만,
  // 정적 export + Cloudflare Workers 자산 서빙에서 확실히 붙도록 명시한다.
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' }
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }]
  },
  openGraph: {
    title: 'kDPP (Demo) - 디지털 제품 여권 플랫폼',
    description: '패션 및 원단 공급망 투명성과 친환경 규제 준수를 위한 디지털 여권 솔루션 데모',
    url: 'https://dpp.using.ai.kr',
    siteName: 'kDPP',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-theme="dark" suppressHydrationWarning>
      <head>
        {/*
          첫 페인트 전에 테마를 확정한다. 이게 없으면 저장값이 light 인 사용자가
          다크 화면을 한 프레임 보고 흰 화면으로 바뀌는 깜빡임을 겪는다.
          정적 export 라 서버가 쿠키를 못 읽으므로 인라인 스크립트가 유일한 방법이다.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('godpp_theme');var t=(s==='light'||s==='dark')?s:(s==='system'||!s?(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):'dark');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`
          }}
        />
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
              <span className="font-bold text-slate-300">kDPP Platform</span>
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
