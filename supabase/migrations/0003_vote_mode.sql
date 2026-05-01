alter table groups
  add column vote_mode text not null default 'date_only'
  check (vote_mode in ('date_only', 'date_time'));
