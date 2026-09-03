# MEMORY.md — GoDPP 개발 및 배포 일지

> **프로젝트명**: GoDPP (디지털 제품 여권 · 순환경제 · LCA · 패션 및 원단 공급망 추적 플랫폼)  
> **공식 서비스 도메인**: `https://dpp.using.ai.kr`  
> **GitHub 레포지토리**: [https://github.com/artgrafy/GoDPP](https://github.com/artgrafy/GoDPP)  
> **작성 일자**: 2026-09-03  
> **상태**: Cloudflare Worker 배포 완료 (Production Live)

---

## 1. 프로젝트 목적 및 배경

- **목적**: EU 에코디자인 규정(ESPR) 및 디지털 제품 여권(DPP), CIRPASS 아키텍처 및 GS1 Digital Link 표준을 준수하는 **패션 의류 및 원단(소재) 공급망 통합 디지털 여권 플랫폼 PoC/시연용 웹 개발**.
- **핵심 요구사항**:
  1. **패션 완제품 DPP**: 제조사의 DPP 등록 & QR 라벨 발급, 소비자의 카메라 QR 스캔 즉시 열람, 국가/인증기관의 심층 감사 데이터 열람.
  2. **원단 공급사 DPP**: 원단 단위 스펙, 친환경 인증(OEKO-TEX, GRS, bluesign®) 및 LCA 탄소배출량 등록, 고유 `FAB-ID` 발급 및 패션 완제품과의 상속·역추적 연계.
  3. **클라우드 실시간 배포**: Cloudflare 글로벌 엣지 배포(`dpp.using.ai.kr`) 및 Supabase 클라우드 데이터베이스(`Success365`) 연동.

---

## 2. 구현된 시스템 아키텍처

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GoDPP Platform Architecture                     │
└────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│  Tier-2 원단포털 │        │  Tier-1 제조콘솔 │        │  국가·검증 포털  │
│ /fabric-supplier │        │  /manufacturer   │        │    /verifier     │
│ - FAB-ID 자동발급│ ─────> │ - 원단ID 자동연동│ <───── │ - HS 통관코드검증│
│ - GRS/OEKO 인증서│        │ - QR 라벨 생성기 │        │ - LCA 원장 감사  │
└──────────────────┘        └──────────────────┘        └──────────────────┘
                                    │
                                    ▼ (QR 스캔)
                        ┌────────────────────────┐
                        │   소비자 공개 랜딩     │
                        │    /p/[passportId]     │
                        │ - 모바일 에코스코어    │
                        │ - 소재/세탁/수리 가이드│
                        │ - 4단계 공급망 타임라인│
                        └────────────────────────┘
```

---

## 3. 주요 구현 컴포넌트 및 기능 상세

| 파일 경로 | 구분 | 설명 |
| :--- | :--- | :--- |
| `src/types/dpp.ts` | 데이터 모델 | EU ESPR/CIRPASS 표준 기반 원단(`FabricDPP`), 완제품(`FashionDPP`), 심층 감사(`DeepComplianceData`), 감사로그(`AuditLog`) 타입 정의 |
| `src/lib/seedData.ts` | 프리셋 데이터 | 아크테라 3L 에코 하드쉘 자켓, 오가닉 서큘러 데님, GRS 인증 원단 2종의 고품질 데모 데이터 |
| `src/lib/supabase.ts` | 데이터 계층 | Supabase PostgreSQL 클라우드 DB + 로컬 캐시 엔진 (하이브리드 동기화) |
| `src/components/Header.tsx` | 내비게이션 | 4대 역할 전환 스위처 (소비자, 제조사, 원단사, 검증기관) 및 QR 카메라 스캐너 연동 |
| `src/components/QRGeneratorModal.tsx` | QR 생성기 | 실제 인쇄용 행택(Hangtag) / 케어라벨(Care Label) 규격 고화질 SVG/PNG QR 생성 및 다운로드 |
| `src/components/QRScannerModal.tsx` | 스캐너 | 웹캠/스마트폰 카메라 QR 실시간 스캔 및 원클릭 프리셋 조회 모달 |
| `src/components/LcaRadarChart.tsx` | 차트 | Recharts 기반 순환경제 5대 지표 레이더 차트 및 Scope 1/2/3 LCA 배출량 바 차트 |
| `src/components/SupplyChainTimeline.tsx` | 공급망 | Tier-4(원자재) ~ Tier-1(봉제) 기업 실명/위치/인증 타임라인 |
| `src/components/DeepDataModal.tsx` | 규제 감사 | 세관 HS 코드, REACH SVHC 유해물질 불검출 성적서, 온체인 DID 전자서명 및 감사 로그 자동 기록 |
| `src/app/page.tsx` | 메인 랜딩 | 플랫폼 소개, 시연 네비게이터, 등록된 의류/원단 목록 |
| `src/app/p/[id]/page.tsx` | 소비자 뷰 | QR 스캔 시 열리는 모바일 최적화 공개 여권 페이지 |
| `src/app/manufacturer/page.tsx` | 제조사 콘솔 | 원단 ID 연계, 신규 의류 DPP 등록, QR 라벨 관리 |
| `src/app/fabric-supplier/page.tsx` | 원단 포털 | 신규 친환경 원단 등록 및 FAB 고유 ID 발급 |
| `src/app/fabric/[id]/page.tsx` | 원단 상세 | 원단 스펙, 친환경 인증서 및 다운스트림 완제품 역추적 링크 |
| `src/app/verifier/page.tsx` | 규제 포털 | 국가 세관 및 인증기관용 규제 적합성 검증 및 실시간 감사 로그(Audit Trail) |

---

## 4. 인프라 및 배포 환경

- **프레임워크**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **배포 플랫폼**: Cloudflare Workers (`wrangler.toml` + 정적 자산 엣지 번들링 `out/`)
- **도메인**: `https://dpp.using.ai.kr` (Cloudflare Custom Domain)
- **클라우드 데이터베이스**: Supabase PostgreSQL (`Success365` 프로젝트, `jftsdfkohskbuunptkrh`)
  - `dpp_fabrics`: 원단 소재 디지털 여권
  - `dpp_passports`: 패션 완제품 디지털 제품 여권
  - `dpp_audit_logs`: 규제기관 및 세관 감사 기록

---

## 5. 작업 진행 히스토리

1. **프로젝트 초기화 및 기본 환경 구축**:
   - Next.js 14, Tailwind CSS, Lucide Icons, Recharts, qrcode.react 패키지 셋업.
   - ESG 글래스모피즘 테마 디자인 시스템(`globals.css`) 구축.
2. **DPP 핵심 기능 및 UI 개발**:
   - 4대 시나리오(소비자, 패션제조사, 원단공급사, 규제검증기관) 페이지 및 컴포넌트 완성.
   - 원단 고유 ID(`FAB-...`) 발급 및 완제품 등록 시 자동 상속/연계 로직 구현.
   - 인쇄용 2D QR 라벨 생성기 및 실시간 카메라 스캐너 구현.
3. **Cloudflare Worker 배포 최적화**:
   - `output: 'export'` 정적 내보내기 최적화 및 `worker/index.ts`, `wrangler.toml` 구성.
   - GitHub 레포지토리(`artgrafy/GoDPP`) 생성 및 CI/CD 연동.
   - `dpp.using.ai.kr` 커스텀 도메인 매핑 및 HTTPS SSL 활성화 완료 (`HTTP 200 OK`).
4. **Supabase 클라우드 데이터베이스 스키마 구성**:
   - `supabase/migrations/20260903_dpp_init.sql` DDL 작성 및 환경변수 주입 완료.

---

## 6. 향후 확장 로드맵 (본 과제/상용화 단계)

- **Supabase Auth / 기업 SSO**: 기업용 승인 계정 기반 정식 로그인 체계 도입.
- **블록체인 DID & 스마트 컨트랙트 메인넷 연동**: Polygon/Klaytn 기반 완제품 DPP 발급 트랜잭션 실시간 온체인 앵커링.
- **openLCA / Ecoinvent 3.9 API 연계**: 원자재 투입량 기반 LCA 탄소발자국 자동 산정 엔진 고도화.
- **글로벌 다국어 지원**: 영어/독일어/프랑스어 등 EU 시장 타겟 다국어 지원.
