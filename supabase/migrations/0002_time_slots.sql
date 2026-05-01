-- preference 컬럼 제거, time_slots 배열 추가
alter table date_votes
  drop column preference;

alter table date_votes
  add column time_slots text[] not null default '{}';

-- delete policy (재투표 시 기존 투표 삭제에 필요)
create policy "date_votes_delete" on date_votes
  for delete using (true);
