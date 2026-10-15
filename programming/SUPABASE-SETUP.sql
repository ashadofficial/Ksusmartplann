-- Run this entire script in Supabase Dashboard > SQL Editor.
-- Public client access is protected by RLS; never use the service_role key in the website.
create table if not exists public.student_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  student_id text not null,
  mobile_number text,
  department text not null,
  academic_year text,
  semester text,
  completed_credits integer not null default 0 check (completed_credits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists student_profiles_student_id_lower_uidx
  on public.student_profiles (lower(student_id));

alter table public.student_profiles enable row level security;

drop policy if exists "Students can read own profile" on public.student_profiles;
create policy "Students can read own profile" on public.student_profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "Students can update own profile" on public.student_profiles;
create policy "Students can update own profile" on public.student_profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Profiles are created by a trusted database trigger, not by public client inserts.
drop policy if exists "Students can insert own profile" on public.student_profiles;
revoke insert, delete on public.student_profiles from anon, authenticated;
grant select, update on public.student_profiles to authenticated;

create or replace function public.create_student_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.student_profiles (id, full_name, student_id, mobile_number, department, academic_year, semester)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Student'),
    lower(coalesce(new.raw_user_meta_data ->> 'student_id', '')),
    nullif(new.raw_user_meta_data ->> 'mobile_number', ''),
    coalesce(new.raw_user_meta_data ->> 'department', ''),
    nullif(new.raw_user_meta_data ->> 'academic_year', ''),
    nullif(new.raw_user_meta_data ->> 'semester', '')
  );
  return new;
exception when unique_violation then
  raise exception 'Student ID already registered';
end;
$$;

drop trigger if exists on_auth_user_created_student_profile on auth.users;
create trigger on_auth_user_created_student_profile
  after insert on auth.users
  for each row execute procedure public.create_student_profile_for_auth_user();
