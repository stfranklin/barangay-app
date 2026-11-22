-- Self-registration with ID review. Run once in the SQL Editor (safe to run again).
-- Supabase may warn about "destructive operations" because of the drop statements. They only replace rules.

alter table public.profiles add column if not exists status text not null default 'approved'; -- existing users stay approved
alter table public.profiles alter column status set default 'pending';                       -- new sign-ups start pending
alter table public.profiles add column if not exists reject_reason text;
alter table public.profiles add column if not exists id_path text;
alter table public.profiles add column if not exists reviewed_at timestamptz;
alter table public.profiles drop constraint if exists profile_status_check;
alter table public.profiles add constraint profile_status_check check (status in ('pending','approved','rejected'));

-- Allow residents to register themselves (admin-created accounts stay approved).
drop trigger if exists on_auth_user_require_admin on auth.users;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, address, contact, status)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'address', new.raw_user_meta_data->>'contact',
          case when new.raw_app_meta_data->>'provisioned_by_admin' = 'true' then 'approved' else 'pending' end);
  return new;
end $$;

create or replace function public.is_approved() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'approved')
$$;

-- Only approved residents can create requests and bookings.
drop policy if exists "insert own" on public.requests;
create policy "insert own" on public.requests for insert with check (user_id = auth.uid() and public.is_approved());
drop policy if exists "insert own" on public.bookings;
create policy "insert own" on public.bookings for insert with check (user_id = auth.uid() and public.is_approved());

-- A resident submits an ID; an admin accepts or rejects the account. Residents cannot change their own status.
create or replace function public.submit_id(p_path text) returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set id_path = p_path, status = 'pending', reject_reason = null
   where id = auth.uid() and status in ('pending','rejected');
end $$;

create or replace function public.review_account(p_id uuid, p_status text, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only administrators can review accounts.'; end if;
  if p_status not in ('approved','rejected') then raise exception 'Invalid status.'; end if;
  update public.profiles set status = p_status, reviewed_at = now(),
         reject_reason = case when p_status = 'rejected' then p_reason else null end
   where id = p_id and role = 'resident';
end $$;
revoke all on function public.submit_id(text), public.review_account(uuid, text, text) from public, anon;
grant execute on function public.submit_id(text), public.review_account(uuid, text, text) to authenticated;

-- Private bucket for ID photos: max 5 MB, images or PDF. Only the owner and admins can read.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ids', 'ids', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf'];
drop policy if exists "ids insert own" on storage.objects;
create policy "ids insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'ids' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "ids read own or admin" on storage.objects;
create policy "ids read own or admin" on storage.objects for select to authenticated
  using (bucket_id = 'ids' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
