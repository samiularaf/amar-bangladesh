-- Run this once in Supabase Dashboard > SQL Editor.
-- It stores report photos securely in Supabase Storage and saves their paths with each report.

alter table public.problems add column if not exists image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('problem-images', 'problem-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "authenticated users can view problem images"
on storage.objects for select to authenticated
using (bucket_id = 'problem-images');

create policy "users upload report images to their own folder"
on storage.objects for insert to authenticated
with check (bucket_id = 'problem-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Administrators can view the community agreement count but cannot cast votes.
drop policy if exists "users add own upvotes" on public.problem_upvotes;
drop policy if exists "users remove own upvotes" on public.problem_upvotes;
create policy "citizens add own upvotes" on public.problem_upvotes for insert to authenticated
with check (user_id = auth.uid() and not public.is_admin());
create policy "citizens remove own upvotes" on public.problem_upvotes for delete to authenticated
using (user_id = auth.uid() and not public.is_admin());

drop function if exists public.problem_with_counts();
create function public.problem_with_counts() returns table (
  id uuid, user_id uuid, user_name text, title text, description text, category text, status text,
  solve_method text, organization_id text, location text, division text, district text, admin_note text,
  image_path text, created_at timestamptz, updated_at timestamptz, upvotes bigint, upvoted_by uuid[]
) language sql stable security definer set search_path = public as $$
  select p.id,p.user_id,pr.name,p.title,p.description,p.category,p.status,p.solve_method,p.organization_id,
    p.location,p.division,p.district,p.admin_note,p.image_path,p.created_at,p.updated_at,
    count(u.user_id), coalesce(array_agg(u.user_id) filter (where u.user_id is not null), '{}')
  from public.problems p join public.profiles pr on pr.id=p.user_id
  left join public.problem_upvotes u on u.problem_id=p.id
  group by p.id,pr.name;
$$;
grant execute on function public.problem_with_counts() to authenticated;
