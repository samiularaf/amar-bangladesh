-- Run once in Supabase SQL Editor. This lets each signed-in user update only safe profile fields.
create or replace function public.update_my_profile(
  profile_name text,
  profile_division text default '',
  profile_district text default '',
  profile_phone text default ''
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare updated_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if length(trim(coalesce(profile_name, ''))) = 0 then
    raise exception 'Name is required';
  end if;
  update public.profiles
  set name = trim(profile_name), division = trim(coalesce(profile_division, '')),
      district = trim(coalesce(profile_district, '')), phone = trim(coalesce(profile_phone, ''))
  where id = auth.uid()
  returning * into updated_profile;
  return updated_profile;
end;
$$;

grant execute on function public.update_my_profile(text, text, text, text) to authenticated;
