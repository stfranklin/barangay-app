-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run again.
alter table public.requests enable row level security;
grant select, insert, update on public.requests to authenticated;

-- 0 Pending, 1 Under Review, 2 Approved, 3 Ready for Claiming, 4 Completed, 5 Rejected
alter table public.requests drop constraint if exists request_status_check;
alter table public.requests add constraint request_status_check check (status between 0 and 5);

drop policy if exists "read own or admin" on public.requests;
drop policy if exists "insert own" on public.requests;
drop policy if exists "admin update" on public.requests;
create policy "read own or admin" on public.requests for select using (user_id = auth.uid() or is_admin());
create policy "insert own" on public.requests for insert with check (user_id = auth.uid());
create policy "admin update" on public.requests for update using (is_admin());
