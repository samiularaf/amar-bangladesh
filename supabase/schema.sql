-- Run this entire file once in Supabase Dashboard > SQL Editor.
-- It creates the application data model and its Row Level Security policies.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  points integer not null default 0 check (points >= 0),
  division text not null default '', district text not null default '', phone text not null default '',
  suspended boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id text primary key, name text not null, short_name text not null,
  categories text[] not null default '{}', created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(), title text not null, title_en text not null default '',
  description text not null, category text not null, duration text not null default '',
  difficulty text not null default 'Beginner', lessons integer not null default 1,
  instructor text not null default '', created_at timestamptz not null default now()
);

create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
  title text not null, description text not null, category text not null,
  status text not null default 'pending' check (status in ('pending','in_progress','resolved','rejected')),
  solve_method text not null default 'organization', organization_id text references public.organizations(id),
  location text not null default '', division text not null default '', district text not null default '',
  admin_note text not null default '', created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), resolved_at timestamptz
);

create table if not exists public.problem_upvotes (
  problem_id uuid not null references public.problems(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(), primary key (problem_id, user_id)
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  completed boolean not null default false, created_at timestamptz not null default now(),
  unique(user_id, course_id)
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, division, district, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'name',''), coalesce(new.email,''),
    coalesce(new.raw_user_meta_data->>'division',''), coalesce(new.raw_user_meta_data->>'district',''),
    coalesce(new.raw_user_meta_data->>'phone',''));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and not suspended);
$$;

create or replace function public.touch_problem() returns trigger language plpgsql as $$
begin new.updated_at = now(); if new.status = 'resolved' and old.status <> 'resolved' then new.resolved_at = now(); update public.profiles set points = points + 50 where id = new.user_id; end if; return new; end; $$;
drop trigger if exists problem_updated on public.problems;
create trigger problem_updated before update on public.problems for each row execute procedure public.touch_problem();

create or replace function public.problem_with_counts() returns table (
  id uuid, user_id uuid, user_name text, title text, description text, category text, status text,
  solve_method text, organization_id text, location text, division text, district text, admin_note text,
  created_at timestamptz, updated_at timestamptz, upvotes bigint, upvoted_by uuid[]
) language sql stable security definer set search_path = public as $$
  select p.id,p.user_id,pr.name,p.title,p.description,p.category,p.status,p.solve_method,p.organization_id,p.location,p.division,p.district,p.admin_note,p.created_at,p.updated_at,
    count(u.user_id), coalesce(array_agg(u.user_id) filter (where u.user_id is not null), '{}')
  from public.problems p join public.profiles pr on pr.id=p.user_id left join public.problem_upvotes u on u.problem_id=p.id
  group by p.id,pr.name;
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.courses enable row level security;
alter table public.problems enable row level security;
alter table public.problem_upvotes enable row level security;
alter table public.enrollments enable row level security;

-- Supabase client roles need table privileges as well as RLS policies.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.organizations, public.courses, public.problems, public.problem_upvotes, public.enrollments to authenticated;

create policy "profiles readable by signed-in users" on public.profiles for select to authenticated using (true);
create policy "admins manage profiles" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "organizations readable" on public.organizations for select to authenticated using (true);
create policy "admins manage organizations" on public.organizations for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "courses readable" on public.courses for select to authenticated using (true);
create policy "admins manage courses" on public.courses for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "problems readable" on public.problems for select to authenticated using (true);
create policy "users submit own problems" on public.problems for insert to authenticated with check (user_id = auth.uid());
create policy "admins update problems" on public.problems for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "upvotes readable" on public.problem_upvotes for select to authenticated using (true);
create policy "users add own upvotes" on public.problem_upvotes for insert to authenticated with check (user_id = auth.uid());
create policy "users remove own upvotes" on public.problem_upvotes for delete to authenticated using (user_id = auth.uid());
create policy "own enrollments readable" on public.enrollments for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "users create own enrollment" on public.enrollments for insert to authenticated with check (user_id = auth.uid());
create policy "users complete own enrollment" on public.enrollments for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant execute on function public.problem_with_counts() to authenticated;
grant execute on function public.is_admin() to authenticated;
