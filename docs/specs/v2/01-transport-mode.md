# 교통수단 선택

> 상태: 📝 작성중

## 목적 (Why)

V1의 위치 추천 로직은 "대중교통 접근성이 좋은 주요 상권" 만 후보로 삼는다. 이 가정은 평일 저녁 모임 같은 케이스에는 잘 맞지만, **차로 이동하는 모임**(주말 근교 드라이브, 짐 많은 모임, 부모와 함께하는 모임 등)에는 부적합하다. 자가용 모임은 "환승역 인근" 보다는 "주차 가능하고 도심 외곽도 OK" 가 더 중요한 기준이기 때문.

이 스펙은 **그룹 생성 시 교통수단을 명시**하게 해서, 위치 추천 알고리즘이 두 모드에서 다른 후보 풀을 사용하도록 한다. 가장 작은 V2 단위로, 회원 기능 같은 큰 변경 없이 추천 품질을 한 단계 끌어올리는 게 목표.

## 사용자 시나리오

**시나리오 A — 자가용 주말 모임 (신규 케이스)**
> 민지가 친구 4명과 주말 차박을 계획한다. 그룹 생성 시 "🚗 자가용" 을 선택한다. 멤버들이 출발지를 입력하면 시스템이 강남·홍대뿐 아니라 판교·일산 같은 외곽 후보까지 포함해 추천한다. 평소 대중교통 추천에서는 후보에 안 뜨던 지역이 떠서 만족.

**시나리오 B — 평일 저녁 모임 (기존 케이스, 회귀)**
> 준호가 동료들과 평일 저녁 모임을 잡는다. 그룹 생성 시 기본값인 "🚇 대중교통" 그대로 둔다. 추천 결과는 V1 시절과 동일하게 강남·홍대·시청 등 환승 거점이 노출된다. **V1 사용자 경험이 깨지지 않는다.**

## UX 상세

### 화면 변화

**그룹 생성 화면 (`app/group/new/page.tsx`)**
- 날짜 범위 입력 아래, 투표 모드 선택 옆 또는 아래에 **교통수단 토글** 추가
- 두 옵션: `🚇 대중교통` (기본값) / `🚗 자가용`
- 토글 옆에 한 줄 도움말: "선택한 교통수단에 맞춰 만남 장소를 추천해요"

**그룹 대시보드 (`app/group/[id]/page.tsx`)**
- 상단 그룹 정보 영역(약속 이름·날짜 범위 등)에 교통수단 배지 표시
- 예: `🚗 자가용 모임` 형태의 작은 칩 컴포넌트

**확정 결과 화면 (`app/group/[id]/result/page.tsx`)**
- 위치 추천 섹션 헤더에 컨텍스트 명시: "자가용 기준 추천 장소" 등
- 추천 알고리즘이 어떤 모드 기준으로 동작했는지 사용자가 인지할 수 있게

### 새 컴포넌트

| 컴포넌트 | 위치 | 역할 |
|----------|------|------|
| `TransportToggle` | `components/group/TransportToggle.tsx` | 대중교통/자가용 2단 세그먼티드 토글. controlled 컴포넌트 (`value`, `onChange` props). |
| `TransportBadge` | `components/group/TransportBadge.tsx` | 그룹의 현재 교통수단을 보여주는 읽기 전용 배지. 대시보드·결과 화면에서 사용. |

shadcn/ui 의 `ToggleGroup` 또는 `RadioGroup` 베이스 활용. 새 라이브러리 추가 금지.

### 상태별 UI

- **빈 상태**: 해당 없음 (생성 시 필수 선택, 기본값 'transit')
- **로딩 상태**: 그룹 생성 API 호출 중에는 토글 비활성화
- **에러 상태**: 별도 케이스 없음. 생성 실패 시 기존 에러 핸들링 재사용

## 데이터 모델 변경

### 마이그레이션

```sql
-- supabase/migrations/YYYYMMDDHHmm_add_transport_mode.sql

alter table groups
  add column transport_mode text not null default 'transit';
  -- 'transit' (대중교통) | 'car' (자가용)

-- CHECK 제약으로 잘못된 값 방지
alter table groups
  add constraint groups_transport_mode_check
  check (transport_mode in ('transit', 'car'));
```

기존 row 는 `default 'transit'` 으로 채워지므로 V1 동작이 자연스럽게 보존됨.

### 타입 변경

```ts
// types/domain.ts
export type TransportMode = 'transit' | 'car';

// Groups 도메인 타입에 추가
export type Group = {
  // ...기존 필드
  transport_mode: TransportMode;
};
```

`pnpm supabase:types` 로 DB 타입 재생성 필수.

## API 변경

### 변경: `POST /api/groups` (그룹 생성)

요청 본문에 `transport_mode` 필드 추가. 누락 시 'transit' 으로 기본 설정 (서버에서).

```ts
// 요청
type CreateGroupBody = {
  name: string;
  date_range_start: string;
  date_range_end: string;
  vote_mode: 'date_only' | 'date_time'; // 기존
  transport_mode?: TransportMode;        // 신규, optional (서버 default)
};

// 응답: 기존 응답에 transport_mode 포함
```

### 변경: `GET /api/groups/[id]` (그룹 조회)

응답 페이로드에 `transport_mode` 포함. 기존 클라이언트는 무시해도 무방.

### 변경: `POST /api/optimal` (최적 추천)

내부 동작 변경 — 그룹의 `transport_mode` 를 읽어서 후보 지역 풀에 반영. 응답 스키마는 그대로.

## 위치 추천 로직 변경

핵심 변경 — `lib/kakao/regions.ts` 의 후보 지역 매핑을 두 모드로 분리.

```ts
// lib/kakao/regions.ts (예시 구조)
export const REGIONS_BY_MODE: Record<TransportMode, Region[]> = {
  transit: [
    // 기존 V1 리스트 — 환승 거점 위주
    { name: '강남', lat: ..., lng: ... },
    { name: '홍대', lat: ..., lng: ... },
    { name: '시청', lat: ..., lng: ... },
    { name: '잠실', lat: ..., lng: ... },
    { name: '건대', lat: ..., lng: ... },
    { name: '신촌', lat: ..., lng: ... },
    // ... V1 의 기존 리스트 그대로
  ],
  car: [
    // 위 리스트 + 외곽 거점 추가
    // ... transit 의 모든 후보
    { name: '판교', lat: ..., lng: ... },
    { name: '일산', lat: ..., lng: ... },
    { name: '분당', lat: ..., lng: ... },
    { name: '안양', lat: ..., lng: ... },
    { name: '구리', lat: ..., lng: ... },
  ],
};
```

`lib/date/optimal.ts` 또는 추천 진입점 함수가 `transport_mode` 를 인자로 받아 위 매핑에서 후보 풀을 선택.

**거리/접근성 계산 자체는 V1 알고리즘 그대로 사용.** 이번 스펙에서는 후보 풀만 다르게 함. (계산 방식 변경은 별도 스펙으로 분리.)

## 환경변수 / 외부 의존성

- 새 환경변수: 없음
- 새 패키지: 없음
- 외부 API 호출량 변화: 자가용 모드에서 후보가 ~5개 늘어나는 만큼 카카오 길찾기 호출 증가. 단일 그룹 1회 추천에서 5건 추가 정도이므로 무시 가능 수준.

## 영향 범위 (Affected Files)

**수정**
- `app/group/new/page.tsx` — 토글 추가, 그룹 생성 요청에 필드 포함
- `app/group/[id]/page.tsx` — `TransportBadge` 노출
- `app/group/[id]/result/page.tsx` — 헤더에 모드 컨텍스트 표시
- `app/api/groups/route.ts` — 요청 바디 검증, DB insert 에 필드 추가
- `app/api/optimal/route.ts` — `transport_mode` 읽어 추천 함수에 전달
- `lib/kakao/regions.ts` — 모드별 후보 매핑으로 구조 변경
- `lib/date/optimal.ts` 또는 추천 함수 — 인자에 `transport_mode` 추가
- `types/domain.ts` — `TransportMode` 타입, `Group` 확장

**신규**
- `components/group/TransportToggle.tsx`
- `components/group/TransportBadge.tsx`
- `supabase/migrations/YYYYMMDDHHmm_add_transport_mode.sql`

**테스트 (신규/추가)**
- `tests/unit/recommendation.test.ts` — 모드별 후보 풀이 다르게 적용되는지
- `tests/unit/api/groups.test.ts` — 요청 바디에 `transport_mode` 처리

## 완료 기준 (Acceptance Criteria)

테스트 가능한 단위로 정리. 구현 에이전트는 모두 충족 시까지 작업 종료 금지.

- [ ] 그룹 생성 화면에 교통수단 토글이 노출된다 (대중교통/자가용, 기본값 대중교통)
- [ ] 토글 변경 시 시각적으로 선택 상태가 강조된다 (focus·selected 스타일)
- [ ] 생성 요청 시 선택값이 `groups.transport_mode` 컬럼에 저장된다
- [ ] 마이그레이션 적용 후 기존 그룹 row 의 `transport_mode` 가 'transit' 으로 채워진다
- [ ] 그룹 대시보드와 결과 화면에 현재 교통수단 배지가 표시된다
- [ ] 자가용 모드에서 위치 추천 결과에 외곽 거점(판교·일산·분당·안양·구리 중 하나 이상)이 후보로 포함된다
- [ ] 대중교통 모드(기본값)에서 추천 결과가 V1 과 동일한 거점 풀에서 선정된다
- [ ] V1 핵심 플로우(그룹 생성 → 투표 → 출발지 입력 → 확정 → 결과)가 깨지지 않는다 — 수동 또는 e2e 회귀
- [ ] 단위 테스트: 추천 함수가 `transport_mode` 인자에 따라 다른 후보 리스트를 참조한다
- [ ] `pnpm typecheck && pnpm lint && pnpm test` 모두 통과

## Out of Scope

이번 스펙에서 **일부러 뺀** 것들. 필요해 보여도 손대지 말 것.

- **멤버별 개별 교통수단 선택** — 그룹 단위 단일 값으로 고정. 멤버 개별 입력은 V2 후속 스펙 후보.
- **자가용 모드의 주차장 정보 표시** — UI 노출, 카카오 주차장 API 사용 등.
- **길찾기 소요 시간/거리 표시** — 별도 스펙으로 분리.
- **교통수단 그룹 생성 후 변경** — 한번 정하면 그룹 종료까지 고정. 변경 필요 시 새 그룹 생성.
- **추천 알고리즘 자체의 변경** — 거리 계산 방식, 접근성 점수 공식은 V1 그대로 유지.
- **활동 추천에 교통수단 반영** — 현재는 위치 추천에만 영향. 활동(실내/실외 등) 결정은 V1 로직 그대로.

## Open Questions

⚠️ 구현 착수 전(상태가 `✅ 승인됨` 으로 바뀌기 전) 사용자가 답해야 하는 질문.

- [ ] **자가용 모드 외곽 후보 리스트의 최종 범위** — 위 예시(판교·일산·분당·안양·구리)에서 추가/삭제할 거점이 있는지? 수원·인천 같은 더 먼 지역까지 포함?
- [ ] **V1 `lib/kakao/regions.ts` 의 현재 구조** — 후보 리스트가 이미 별도 파일로 분리돼 있는지, 아니면 추천 함수 내부에 하드코딩돼 있는지? (구조 리팩토링 범위 결정용)
- [ ] **UI 라벨링** — 토글 라벨을 "🚇 대중교통 / 🚗 자가용" 으로 갈지, "지하철·버스 / 자동차" 같은 텍스트 위주로 갈지? 아이콘 사용 가이드라인 있는지?
- [ ] **회귀 테스트의 범위** — V1 동작 보장을 위해 e2e 테스트를 새로 추가할지, 수동 검증으로 충분히 할지?
