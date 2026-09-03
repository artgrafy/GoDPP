export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 정적 자산 서빙 (Next.js out 디렉터리)
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
      // SPA Fallback: 404 시 index.html 서빙
      const indexUrl = new URL('/', request.url);
      return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
    }

    return new Response('GoDPP Platform Worker Ready', { status: 200 });
  },
};
