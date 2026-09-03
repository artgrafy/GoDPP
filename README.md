# GoDPP — 디지털 제품 여권(DPP) & 순환경제 플랫폼

> **EU 에코디자인 규정(ESPR) 및 CIRPASS 아키텍처 기반 패션 & 원단 디지털 제품 여권(DPP) 플랫폼**  
> 배포 도메인: `https://dpp.using.ai.kr`  
> 프로젝트 레포지토리: `GoDPP`

---

## 🌟 핵심 기능 및 시연 시나리오

```
┌───────────────────────────┐      ┌───────────────────────────┐
│     1. 원단 공급사 포털     │      │     2. 패션 제조사 콘솔     │
│   (/fabric-supplier)      │      │     (/manufacturer)       │
│  - 친환경 혼용률 / 중량     │ ───> │  - 원단 고유 ID 자동 연계  │
│  - GRS / OEKO-TEX 인증서  │      │  - 완제품 DPP 발급        │
│  - 고유 원단 ID(FAB) 발급 │      │  - 2D QR 라벨 생성/인쇄   │
└───────────────────────────┘      └───────────────────────────┘
                                                 │
                                                 ▼
┌───────────────────────────┐      ┌───────────────────────────┐
│     3. 소비자 공개 뷰       │      │   4. 국가·검증기관 심층감사  │
│        (/p/[id])          │ <─── │        (/verifier)        │
│  - 카메라 QR 스캔 즉시 접속 │      │  - 세관 HS 통관코드 조회   │
│  - 에코스코어 / 소재 인포   │      │  - Scope 1·2·3 LCA 원장   │
│  - 세탁/수리/순환경제 가이드│      │  - SVHC 유해물질 불검출증빙│
└───────────────────────────┘      └───────────────────────────┘
```

1. **패션 완제품 DPP (`/manufacturer`, `/p/[id]`)**:
   - 패션 제조사는 원단 고유 ID를 연동하여 손쉽게 완제품 DPP를 등록하고, 행택(Hangtag)/케어라벨(Care Label) 인쇄용 QR 코드를 생성합니다.
   - 소비자는 스마트폰 기본 카메라로 QR을 스캔하여 앱 설치 없이 즉시 에코스코어, 소재 성분, 세탁 및 의류 수명 연장 팁, 순환경제 가이드를 조회합니다.
2. **원단(소재) 공급사 DPP (`/fabric-supplier`, `/fabric/[id]`)**:
   - 원단/방적/염색 업체(Tier-2/3)는 원단 스펙, 친환경 인증(GRS, GOTS, OEKO-TEX, bluesign®), 원단 단위 LCA 탄소배출량, PFAS Free 성적서를 등록합니다.
   - 발급된 고유 원단 ID (`FAB-2026-ECO-0991`)를 통해 패션 제조사가 공급망 데이터를 상속받고, 해당 원단을 채택한 완제품들을 역추적합니다.
3. **국가 및 공인 시험인증기관 심층 감사 (`/verifier`, Deep Data Modal)**:
   - 세관, 시장 감시 당국, 시험연구원을 위한 RBAC 기반 심층 데이터 포털.
   - HS 통관코드, ISO 14040/44 LCA 인벤토리, REACH SVHC 불검출 시험성적서 및 온체인 위변조 방지 해시를 제공하며, 열람 감사 로그(Audit Log)가 자동 기록됩니다.

---

## 🚀 빠른 시작 (Local Development)

```bash
# 1. 의존성 설치
npm install

# 2. 로컬 개발 서버 실행
npm run dev
# 브라우저에서 http://localhost:3000 접속
```

---

## 🌐 Cloudflare / Vercel 배포 & 도메인 설정 (`dpp.using.ai.kr`)

### 방법 1: Cloudflare Pages 배포
1. Cloudflare Dashboard -> **Workers & Pages** -> **Create application** -> **Pages**
2. GitHub의 `GoDPP` 레포지토리 연결
3. 빌드 설정:
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npx @cloudflare/next-on-pages` 또는 `npm run build`
   - **Output Directory**: `.vercel/output/static` (or `.next`)
4. **Custom Domain**: `dpp.using.ai.kr` 등록 (using.ai.kr DNS에 CNAME 자동 연결)
5. 환경 변수 등록 (선택 사항):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://jftsdfkohskbuunptkrh.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `(발급된 Supabase Anon Key)`
   - `NEXT_PUBLIC_APP_URL` = `https://dpp.using.ai.kr`

### 방법 2: Vercel 배포
1. Vercel Dashboard -> **Add New Project** -> `GoDPP` Import
2. Settings -> **Domains** -> `dpp.using.ai.kr` 추가
3. Cloudflare DNS에 Vercel CNAME(`cname.vercel-dns.com`) 추가

---

## 🗄️ Supabase 클라우드 데이터베이스 연동

`supabase/migrations/20260903_dpp_init.sql` 파일에 정의된 DDL 스크립트를 Supabase 대시보드 (`Success365` 프로젝트)의 **SQL Editor**에 복사하여 실행하면 테이블이 즉시 준비됩니다.

- `dpp_fabrics`: 원단(소재) 디지털 여권
- `dpp_passports`: 패션 완제품 디지털 제품 여권
- `dpp_audit_logs`: 규제기관 및 세관 감사 로그
