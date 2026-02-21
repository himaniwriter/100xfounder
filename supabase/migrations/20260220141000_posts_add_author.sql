alter table if exists public.posts
  add column if not exists author text;

update public.posts
set author = '100Xfounder Research'
where author is null;

alter table if exists public.posts
  alter column author set default '100Xfounder Research',
  alter column author set not null;
