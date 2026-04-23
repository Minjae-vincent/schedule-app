-- groups 테이블
create table groups (
  id uuid primary key default gen_random_uuid(),
  invite_token text unique not null,
  name text not null,
  creator_nickname text not null,
  date_range_start date not null,
  date_range_end date not null,
  status text not null default 'voting' check (status in ('voting', 'confirmed')),
  confirmed_date date,
  confirmed_region text,
  confirmed_lat double precision,
  confirmed_lng double precision,
  created_at timestamptz default now()
);

-- members 테이블
create table members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  nickname text not null,
  origin_address text,
  origin_lat double precision,
  origin_lng double precision,
  created_at timestamptz default now()
);

-- date_votes 테이블
create table date_votes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  vote_date date not null,
  preference text not null check (preference in ('available', 'if_needed')),
  unique (member_id, vote_date)
);

-- RLS 활성화
alter table groups enable row level security;
alter table members enable row level security;
alter table date_votes enable row level security;

-- groups: invite_token이 있으면 읽기 가능
create policy "groups_select_by_token" on groups
  for select using (true);

-- groups: 누구나 생성 가능 (API Routes에서 service role 사용)
create policy "groups_insert" on groups
  for insert with check (true);

-- members: 해당 그룹에 속한 경우 읽기 가능
create policy "members_select" on members
  for select using (true);

-- members: 누구나 참여 가능 (API Routes에서 service role 사용)
create policy "members_insert" on members
  for insert with check (true);

-- date_votes: 읽기/쓰기
create policy "date_votes_select" on date_votes
  for select using (true);

create policy "date_votes_insert" on date_votes
  for insert with check (true);

create policy "date_votes_update" on date_votes
  for update using (true);
