-- Run this once after course_access_and_progress.sql.

alter table public.courses add column if not exists completion_reward integer not null default 0 check (completion_reward >= 0);

alter table public.enrollments add column if not exists rewarded_at timestamptz;
create or replace function public.record_course_progress(course_uuid uuid, seconds_watched integer) returns public.enrollments
language plpgsql security definer set search_path = public as $$
declare enrollment public.enrollments; max_seconds integer; reward integer;
begin
  if auth.uid() is null then raise exception 'অনুমোদন নেই'; end if;
  select c.duration_minutes * 60, c.completion_reward into max_seconds, reward from public.courses c where c.id = course_uuid;
  update public.enrollments set progress_seconds = least(greatest(seconds_watched, 0), max_seconds), completed = seconds_watched >= max_seconds
  where user_id = auth.uid() and course_id = course_uuid returning * into enrollment;
  if enrollment is null then raise exception 'আগে কোর্সে ভর্তি হন'; end if;
  if enrollment.completed and enrollment.rewarded_at is null then
    update public.profiles set current_points = current_points + reward, lifetime_points = lifetime_points + reward, points = points + reward where id = auth.uid();
    update public.enrollments set rewarded_at = now() where id = enrollment.id returning * into enrollment;
  end if;
  return enrollment;
end; $$;
grant execute on function public.record_course_progress(uuid, integer) to authenticated;
