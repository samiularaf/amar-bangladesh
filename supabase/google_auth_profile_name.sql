-- Run once in Supabase SQL Editor before enabling Google Auth.
-- Google provides `full_name`, while email/password registration provides `name`.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, division, district, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'user_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'division', ''),
    coalesce(new.raw_user_meta_data->>'district', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$;
