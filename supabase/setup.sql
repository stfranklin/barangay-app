-- Run this once in Supabase: SQL Editor > New query > paste > Run.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text, address text, contact text,
  role text not null default 'resident' check (role in ('resident','admin')),
  active boolean not null default true,
  created_at timestamptz default now()
);

create table requests (
  id bigint generated always as identity primary key,
  ref text unique,
  user_id uuid not null references profiles(id) on delete cascade,
  doc text not null, full_name text, address text, contact text, purpose text,
  status int not null default 0,
  created_at timestamptz default now()
);

create table bookings (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('court','clinic')),
  date date not null, time text not null, nurse text,
  created_at timestamptz default now(),
  unique (kind, date, time)   -- blocks double bookings for everyone
);

-- Create a profile automatically when someone registers.
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, address, contact)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'address', new.raw_user_meta_data->>'contact');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

alter table profiles enable row level security;
alter table requests enable row level security;
alter table bookings enable row level security;

-- Residents can only edit these columns of their own profile (not role).
revoke update on profiles from authenticated;
grant update (full_name, address, contact) on profiles to authenticated;

create policy "read own or admin" on profiles for select using (id = auth.uid() or is_admin());
create policy "update own" on profiles for update using (id = auth.uid());

create policy "read own or admin" on requests for select using (user_id = auth.uid() or is_admin());
create policy "insert own" on requests for insert with check (user_id = auth.uid());
create policy "admin update" on requests for update using (is_admin());

-- Everyone signed in can see which slots are taken.
create policy "read all" on bookings for select using (auth.uid() is not null);
create policy "insert own" on bookings for insert with check (user_id = auth.uid());
create policy "delete own or admin" on bookings for delete using (user_id = auth.uid() or is_admin());

-- AFTER you register your own account, make it an admin (put your email):
-- update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
