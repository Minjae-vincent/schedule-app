# CLAUDE.md

> 이 문서는 Claude Code가 이 프로젝트에서 일할 때 **항상 먼저 참조**하는 규칙서입니다.
> 제품 스펙(무엇을 만들까)은 `PRODUCT.md` 참조. 이 문서는 **어떻게 만들까**.

---

## 프로젝트 한 줄 요약

친구들끼리 모이는 약속의 **날짜 · 장소 · 활동** 을 자동 추천하는 일정 조율 웹앱.
상세 스펙은 반드시 `PRODUCT.md` 를 읽고 시작할 것.

## 기술 스택 (확정 — 임의 변경 금지)

- **프론트엔드**: Next.js 15 (App Router) + TypeScript (strict)
- **스타일**: Tailwind CSS + shadcn/ui
- **데이터**: Supabase (Postgres + RLS)
- **지도/장소**: 카카오맵 JS SDK + 카카오 로컬 REST API
- **날씨**: OpenWeather API (5일 예보 엔드포인트)
- **배포**: Vercel (프론트 + API Routes)
- **패키지 매니저**: pnpm
- **테스트**: Vitest (유닛) + Playwright (핵심 플로우 e2e, 1~2개만)

**새로운 런타임/프레임워크 추가 금지.** 필요하면 반드시 사용자에게 먼저 물어볼 것.

## 아키텍처

```
┌─────────────────────────────────────┐
│  Next.js App (Vercel)               │
│                                     │
│  ┌────────────┐   ┌──────────────┐  │
│  │ React UI   │──▶│ API Routes   │  │
│  │ (RSC 기본) │   │ /app/api/... │  │
│  └────────────┘   └──────┬───────┘  │
│         │                │          │
└─────────┼────────────────┼──────────┘
          │                │
          │ Supabase JS    │ server-only fetch
          ▼                ▼
    ┌──────────┐    ┌─────────────────────┐
    │ Supabase │    │ 카카오 / OpenWeather│
    │  (DB)    │    │   외부 API          │
    └──────────┘    └─────────────────────┘
```

**원칙:**
- 프론트에서 Supabase에 직접 접근 (단, RLS로 권한 통제)
- 외부 API는 **반드시 API Routes를 통해** 호출 (키 노출 방지)
- 복잡한 계산 로직(최적 날짜, 중간 지점)도 API Routes에 둠

## 디렉토리 구조

```
app/
  (marketing)/
    page.tsx                    # 홈
  group/
    new/page.tsx                # 그룹 생성
    [id]/page.tsx               # 그룹 대시보드
    [id]/join/page.tsx          # 참여 화면
    [id]/result/page.tsx        # 확정 결과
  api/
    groups/route.ts             # 그룹 생성/조회
    members/route.ts            # 참여자 등록
    votes/route.ts              # 투표
    optimal/route.ts            # 최적 날짜·위치 계산
    weather/route.ts            # 날씨 프록시
    places/route.ts             # 카카오 장소 검색 프록시
  layout.tsx
  globals.css

components/
  ui/                           # shadcn/ui 컴포넌트
  group/                        # 그룹 관련 컴포넌트
  vote/                         # 투표 UI
  map/                          # 지도 관련

lib/
  supabase/
    client.ts                   # 브라우저 클라이언트
    server.ts                   # 서버 클라이언트 (service role)
  kakao/
    client.ts                   # 카카오 API 래퍼
    midpoint.ts                 # 중간 지점 계산
  weather/
    client.ts                   # 날씨 API 래퍼
  date/
    optimal.ts                  # 최적 날짜 알고리즘
  recommendation/
    suggest.ts                  # 날씨 기반 활동 추천 로직

types/
  db.ts                         # Supabase 생성 타입
  domain.ts                     # 도메인 타입

tests/
  unit/
  e2e/

.env.local                      # (gitignore)
```

## 환경 변수

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # 서버 전용, 절대 NEXT_PUBLIC_ 금지

# 카카오
NEXT_PUBLIC_KAKAO_JS_KEY=          # 지도 SDK용 (도메인 제한 걸려 있음)
KAKAO_REST_API_KEY=                # 서버 전용 (장소검색, 주소→좌표)

# OpenWeather
OPENWEATHER_API_KEY=               # 서버 전용
```

**NEXT_PUBLIC_ 접두사가 붙은 키만 클라이언트에 노출됨. 그 외는 절대 금지.**

## DB 스키마 (Supabase)

초안 — 구현 시 마이그레이션 파일로 관리.

```sql
-- 그룹 (약속 단위)
create table groups (
  id uuid primary key default gen_random_uuid(),
  invite_token text unique not null,        -- 초대 링크용 짧은 토큰
  name text not null,
  creator_nickname text not null,
  date_range_start date not null,
  date_range_end date not null,
  status text not null default 'voting',    -- 'voting' | 'confirmed'
  confirmed_date date,
  confirmed_region text,
  confirmed_lat double precision,
  confirmed_lng double precision,
  created_at timestamptz default now()
);

-- 멤버 (비회원)
create table members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  nickname text not null,
  origin_address text,
  origin_lat double precision,
  origin_lng double precision,
  created_at timestamptz default now()
);

-- 날짜 투표
create table date_votes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  vote_date date not null,
  preference text not null,                 -- 'available' | 'if_needed'
  unique (member_id, vote_date)
);
```

**RLS 정책:**
- 모든 테이블 RLS 활성화
- 그룹 접근은 `invite_token` 을 쿠키/헤더로 받아 검증
- 구체 정책은 구현 시 `supabase/migrations/` 에 작성

## 코딩 컨벤션

- **파일명**: 컴포넌트는 PascalCase.tsx, 그 외 lowercase
- **React**: Server Components 기본. 꼭 필요할 때만 `'use client'`
- **타입**: `any` 금지. 불명확하면 `unknown` 후 좁히기
- **에러 처리**: API Routes는 항상 `{ ok: true, data } | { ok: false, error }` 형태로 응답
- **데이터 페칭**:
  - 서버 컴포넌트: 직접 Supabase 서버 클라이언트 사용
  - 클라이언트 컴포넌트: `fetch('/api/...')` 또는 Supabase 브라우저 클라이언트
- **주석**: "왜"만. "무엇"은 코드가 설명하게
- **import 경로**: `@/` 루트 alias 사용

## 검증 루프 (⚠️ 반드시 실행)

코드 변경 후에는 **반드시** 아래를 실행하고, 실패 시 수정한 뒤 다시 실행:

```bash
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm test         # vitest run
```

세 개 중 하나라도 실패한 상태로 작업을 종료하지 말 것.

## 금지사항 (DO NOT)

1. **외부 API 키를 클라이언트에 노출하지 않는다** (`NEXT_PUBLIC_` 접두사 규칙 엄수)
2. **`PRODUCT.md` 에 없는 기능을 임의로 추가하지 않는다** — 필요하면 먼저 사용자에게 확인
3. **로그인/회원가입 기능을 만들지 않는다** (V1 비목표)
4. **새 런타임/프레임워크/ORM 을 도입하지 않는다** — 스택은 위에 박아둔 것이 전부
5. **`any` 타입, `@ts-ignore`, `eslint-disable` 을 남발하지 않는다**
6. **`useEffect` 로 데이터 페칭을 우회하지 않는다** — 서버 컴포넌트를 먼저 고려
7. **대규모 리팩토링을 사용자 승인 없이 하지 않는다**

## 개발 워크플로우

### 새 기능 시작 시

1. `PRODUCT.md` 에 매핑되는 기능인지 확인
2. Plan 모드로 설계 → 사용자 승인 후 구현
3. **수직 슬라이스**: 한 기능에 대해 DB → API → UI 를 한 번에 끝까지
4. 구현 후 검증 루프 3종 실행

### 완성 단계별 체크포인트

- **Milestone 1**: 그룹 생성 + 초대 링크 + 닉네임 참여만 — 가장 작은 e2e
- **Milestone 2**: 날짜 투표 + 최적 날짜 추천
- **Milestone 3**: 출발지 입력 + 중간 지점 추천
- **Milestone 4**: 날씨 조회 + 활동 추천
- **Milestone 5**: 확정 플로우 + 결과 공유 화면

각 마일스톤 끝에서 **실제로 배포해서 써보기** (Vercel preview).

## 주요 계산 로직 위치

| 기능 | 위치 |
|------|------|
| 최적 날짜 (투표 집계) | `lib/date/optimal.ts` |
| 중간 지점 계산 | `lib/kakao/midpoint.ts` |
| 주요 상권 매핑 | `lib/kakao/regions.ts` |
| 날씨 → 활동 카테고리 | `lib/recommendation/suggest.ts` |
| 장소 추천 (카카오 로컬) | `lib/kakao/places.ts` |

각 파일은 순수 함수로 작성 — 외부 API 호출은 얇은 client 모듈에 분리해 테스트 가능하게.

## 자주 쓰는 명령어

```bash
pnpm dev                        # 개발 서버
pnpm typecheck                  # 타입 체크
pnpm lint                       # 린트
pnpm test                       # 단위 테스트
pnpm test:e2e                   # Playwright
pnpm supabase:types             # Supabase 타입 재생성
pnpm supabase db push           # 마이그레이션 적용
```

## 질문이 생기면

- **제품 관련 ("이 기능 넣을까요?")** → `PRODUCT.md` 확인, 없으면 사용자에게 질문
- **기술 관련 ("이 라이브러리 쓸까요?")** → 위 스택에 없으면 사용자에게 질문
- **설계 관련 ("이렇게 구조 잡을까요?")** → Plan 모드로 제안 후 승인 받기

절대 혼자 판단해서 스펙·스택·구조를 확장하지 말 것.
