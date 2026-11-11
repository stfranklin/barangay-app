-- Run in Supabase SQL Editor for an existing project.
create extension if not exists btree_gist;

-- Court reservations use hourly intervals and PHP 100 per hour.
alter table public.bookings add column if not exists start_time time;
alter table public.bookings add column if not exists end_time time;
alter table public.bookings add column if not exists hours int;
alter table public.bookings add column if not exists fee int;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'court_booking_fee_check'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings add constraint court_booking_fee_check
      check (kind <> 'court' or (
        start_time is not null and end_time > start_time and hours > 0
        and hours = extract(epoch from (end_time - start_time)) / 3600
        and fee = hours * 100
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'court_bookings_no_overlap'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings add constraint court_bookings_no_overlap
      exclude using gist (
        kind with =,
        date with =,
        (tsrange(date + start_time, date + end_time)) with &&
      ) where (kind = 'court');
  end if;
end $$;

-- Store resident email on profiles so administrators can review their accounts.
alter table public.profiles add column if not exists email text;
update public.profiles as p
set email = u.email
from auth.users as u
where u.id = p.id and p.email is distinct from u.email;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, address, contact)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email,
          new.raw_user_meta_data->>'address', new.raw_user_meta_data->>'contact');
  return new;
end $$;

-- Only users provisioned by the protected Edge Function may be added after bootstrap.
create or replace function require_admin_created_user() returns trigger
language plpgsql security definer set search_path = auth, public as $$
begin
  if new.raw_app_meta_data->>'provisioned_by_admin' = 'true' then return new; end if;
  if not exists (select 1 from auth.users) then return new; end if;
  raise exception 'Accounts must be created by an administrator.';
end $$;

drop trigger if exists on_auth_user_require_admin on auth.users;
create trigger on_auth_user_require_admin before insert on auth.users
  for each row execute function require_admin_created_user();
