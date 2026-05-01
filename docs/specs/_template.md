# [기능명]

> 상태: 📝 작성중

## 목적 (Why)

이 기능을 왜 만드는지 1~2 문단.
- 사용자가 어떤 문제를 겪고 있는가?
- 이 기능이 그 문제를 어떻게 해결하는가?
- 왜 지금 만들어야 하는가?

## 사용자 시나리오

구체적인 happy path 1~2개. 페르소나·상황·기대 결과를 짧게.

> 예) 민지(주최자)가 약속을 만들 때 "자가용 이동" 옵션을 선택한다. 멤버들이 출발지를 입력하면 시스템이 주차 가능 지역을 우선해 추천한다. 민지는 추천 결과에 만족하고 확정한다.

## UX 상세

### 화면 변화

어느 화면이 바뀌는지, 어떤 컴포넌트가 추가/수정되는지 화면 단위로 정리.

- **그룹 생성 화면**: ...
- **참여 화면**: ...
- **결과 화면**: ...

### 새 컴포넌트

| 컴포넌트 | 위치 | 역할 |
|----------|------|------|
| `TransportToggle` | `components/group/TransportToggle.tsx` | 자가용/대중교통 선택 토글 |

### 상태별 UI

- **빈 상태 (empty state)**: 아직 아무도 입력하지 않은 경우
- **로딩 상태**: 추천 계산 중
- **에러 상태**: API 실패 시 fallback

## 데이터 모델 변경

새 테이블·컬럼·인덱스. **반드시 정확한 SQL** 로 명시.

```sql
-- 예시: groups 테이블에 교통수단 컬럼 추가
alter table groups
  add column transport_mode text not null default 'transit';
  -- 'transit' | 'car'

-- 예시: 인덱스 추가
create index if not exists idx_groups_status on groups(status);
```

마이그레이션 파일명 규칙: `supabase/migrations/YYYYMMDDHHmm_xxx.sql`

## API 변경

### 새 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/groups` | (변경) 요청 본문에 `transport_mode` 추가 |

요청/응답 스키마는 TypeScript 타입으로 명시:

```ts
// POST /api/groups 요청
type CreateGroupBody = {
  name: string;
  date_range_start: string; // YYYY-MM-DD
  date_range_end: string;
  transport_mode: 'transit' | 'car'; // 신규
};
```

### 기존 엔드포인트 변경

기존 라우트의 어떤 필드가 어떻게 바뀌는지 명시. 호환성 깨지면 마이그레이션 전략도.

## 환경변수 / 외부 의존성

- 새로 필요한 환경변수: 없음 / `XXX_API_KEY` 등
- 새로 깔아야 할 패키지: 없음 / `pnpm add foo`

## 영향 범위 (Affected Files)

수정·신규 파일 목록 — 구현 에이전트가 작업 시작 전에 한 번에 파악할 수 있게.

- 수정: `app/group/new/page.tsx`, `app/api/groups/route.ts`
- 신규: `components/group/TransportToggle.tsx`
- DB 마이그레이션: `supabase/migrations/...`

## 완료 기준 (Acceptance Criteria)

테스트 가능한 문장으로 작성. 구현 에이전트가 자가 검증할 수 있게.

- [ ] 그룹 생성 화면에 교통수단 토글이 노출된다 (기본값: 대중교통)
- [ ] 선택한 교통수단이 DB에 저장된다 (`groups.transport_mode`)
- [ ] 결과 화면에서 선택한 교통수단에 맞는 위치 추천이 나온다
- [ ] V1 동작(투표·확정·날씨)이 깨지지 않는다 (수동 회귀 테스트)
- [ ] `pnpm typecheck && pnpm lint && pnpm test` 모두 통과

## Out of Scope

이번 스펙에서 **일부러 뺀** 것들. 스코프 크리프 방지용.

- 멤버별 개별 교통수단 선택 (그룹 단위로만 결정)
- 자가용 선택 시 주차장 정보 노출
- 길찾기 결과(소요시간) 표시

## Open Questions

스펙 작성 중 결정 못 한 것. 구현 들어가기 **전에** 사용자가 답해야 하는 질문.

- [ ] 자가용 선택 시 카카오 길찾기 API 의 어떤 모드를 쓰는지?
- [ ] 추천 후보 지역 리스트가 자가용/대중교통에서 달라야 하는지?
