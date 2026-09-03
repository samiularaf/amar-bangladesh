-- Run this once if the app shows: "permission denied for table profiles".
-- RLS remains enabled; these grants only allow the policies in schema.sql to run.

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.organizations, public.courses, public.problems, public.problem_upvotes, public.enrollments to authenticated;
