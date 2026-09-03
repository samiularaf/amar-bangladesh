-- Run this once in Supabase SQL Editor after the existing schema files.
-- Current points are spendable; lifetime points are used only for the leaderboard.

alter table public.profiles add column if not exists current_points integer not null default 0 check (current_points >= 0);
alter table public.profiles add column if not exists lifetime_points integer not null default 0 check (lifetime_points >= 0);
update public.profiles set current_points = points, lifetime_points = points where current_points = 0 and lifetime_points = 0;

alter table public.courses add column if not exists enrollment_cost integer not null default 100 check (enrollment_cost >= 0);
alter table public.courses add column if not exists duration_minutes integer not null default 120 check (duration_minutes > 0);
alter table public.enrollments add column if not exists progress_seconds integer not null default 0 check (progress_seconds >= 0);

update public.courses set enrollment_cost = case difficulty when 'Beginner' then 100 when 'Intermediate' then 200 when 'Advanced' then 300 else 100 end;

-- Reporting/resolution earns both balances. Course enrollment spends only current points.
create or replace function public.award_submission_points() returns trigger language plpgsql security definer set search_path = public as $$
begin update public.profiles set points = points + 10, current_points = current_points + 10, lifetime_points = lifetime_points + 10 where id = new.user_id; return new; end; $$;
create or replace function public.touch_problem() returns trigger language plpgsql as $$
begin new.updated_at = now(); if new.status = 'resolved' and old.status <> 'resolved' then new.resolved_at = now(); update public.profiles set points = points + 50, current_points = current_points + 50, lifetime_points = lifetime_points + 50 where id = new.user_id; end if; return new; end; $$;
drop trigger if exists enrollment_created on public.enrollments;
drop trigger if exists enrollment_completed on public.enrollments;

create or replace function public.enroll_in_course(course_uuid uuid) returns public.enrollments
language plpgsql security definer set search_path = public as $$
declare cost integer; enrollment public.enrollments;
begin
  if auth.uid() is null then raise exception 'অনুমোদন নেই'; end if;
  select enrollment_cost into cost from public.courses where id = course_uuid;
  if cost is null then raise exception 'কোর্স পাওয়া যায়নি'; end if;
  if exists (select 1 from public.enrollments where user_id = auth.uid() and course_id = course_uuid) then raise exception 'ইতিমধ্যে এই কোর্সে ভর্তি হয়েছেন'; end if;
  update public.profiles set current_points = current_points - cost where id = auth.uid() and current_points >= cost;
  if not found then raise exception 'এই কোর্সে ভর্তির জন্য পর্যাপ্ত পয়েন্ট নেই'; end if;
  insert into public.enrollments (user_id, course_id) values (auth.uid(), course_uuid) returning * into enrollment;
  return enrollment;
end; $$;

create or replace function public.record_course_progress(course_uuid uuid, seconds_watched integer) returns public.enrollments
language plpgsql security definer set search_path = public as $$
declare enrollment public.enrollments; max_seconds integer;
begin
  if auth.uid() is null then raise exception 'অনুমোদন নেই'; end if;
  select c.duration_minutes * 60 into max_seconds from public.courses c where c.id = course_uuid;
  update public.enrollments set progress_seconds = least(greatest(seconds_watched, 0), max_seconds), completed = seconds_watched >= max_seconds
  where user_id = auth.uid() and course_id = course_uuid returning * into enrollment;
  if enrollment is null then raise exception 'আগে কোর্সে ভর্তি হন'; end if;
  return enrollment;
end; $$;

grant execute on function public.enroll_in_course(uuid), public.record_course_progress(uuid, integer) to authenticated;
