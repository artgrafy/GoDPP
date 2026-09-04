export interface Env {
  ASSETS: {
    fetch: (req: Request | string) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 정적 웹 자산 서빙 (Next.js out 디렉터리)
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }

      const url = new URL(request.url);

      // 1. 원단 동적 상세 라우팅 (/fabric/...) 404 발생 시 -> /fabric 서빙
      if (url.pathname.startsWith('/fabric/')) {
        const fabricUrl = new URL('/fabric', url.origin);
        const fbRes = await env.ASSETS.fetch(new Request(fabricUrl.toString(), request));
        if (fbRes.status !== 404) {
          return fbRes;
        }
      }

      // 2. 완제품 DPP 동적 상세 라우팅 (/p/...) 404 발생 시 -> /p 서빙
      if (url.pathname.startsWith('/p/')) {
        const pUrl = new URL('/p', url.origin);
        const pRes = await env.ASSETS.fetch(new Request(pUrl.toString(), request));
        if (pRes.status !== 404) {
          return pRes;
        }
      }

      // 3. 일반 SPA Fallback: 최상위 index.html 서빙
      const indexUrl = new URL('/', url.origin);
      return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
    }

    return new Response('GoDPP Platform Worker Ready', { status: 200 });
  },
};
