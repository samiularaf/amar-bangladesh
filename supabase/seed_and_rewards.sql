-- Run this once AFTER schema.sql in Supabase Dashboard > SQL Editor.
-- It adds starter data and awards points automatically for app activity.

create or replace function public.award_submission_points() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set points = points + 10 where id = new.user_id;
  return new;
end; $$;
drop trigger if exists problem_created on public.problems;
create trigger problem_created after insert on public.problems for each row execute procedure public.award_submission_points();

create or replace function public.award_enrollment_points() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set points = points + 5 where id = new.user_id;
  return new;
end; $$;
drop trigger if exists enrollment_created on public.enrollments;
create trigger enrollment_created after insert on public.enrollments for each row execute procedure public.award_enrollment_points();

create or replace function public.award_completion_points() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.completed and not old.completed then update public.profiles set points = points + 20 where id = new.user_id; end if;
  return new;
end; $$;
drop trigger if exists enrollment_completed on public.enrollments;
create trigger enrollment_completed after update on public.enrollments for each row execute procedure public.award_completion_points();

insert into public.organizations (id, name, short_name, categories) values
  ('DNCC', 'ঢাকা উত্তর সিটি কর্পোরেশন', 'DNCC', array['Road','Garbage','Other']),
  ('DSCC', 'ঢাকা দক্ষিণ সিটি কর্পোরেশন', 'DSCC', array['Road','Garbage','Other']),
  ('WASA', 'ঢাকা ওয়াসা', 'DWASA', array['Water']),
  ('DESCO', 'ঢাকা ইলেকট্রিক সাপ্লাই কোম্পানি', 'DESCO', array['Electricity']),
  ('DPDC', 'ঢাকা পাওয়ার ডিস্ট্রিবিউশন', 'DPDC', array['Electricity']),
  ('DC', 'জেলা প্রশাসক অফিস', 'DC Office', array['Other'])
on conflict (id) do nothing;

insert into public.courses (title, title_en, description, category, duration, difficulty, lessons, instructor) values
  ('নাগরিক অধিকার ও দায়িত্ব', 'Civic Rights & Responsibilities', 'বাংলাদেশের নাগরিক হিসেবে আপনার অধিকার ও দায়িত্ব সম্পর্কে জানুন।', 'Civic Awareness', '৪ ঘন্টা', 'Beginner', 8, 'ড. আব্দুল করিম'),
  ('পরিবেশ সংরক্ষণ', 'Environmental Conservation', 'আমাদের পরিবেশ রক্ষায় ব্যক্তিগত ও সামাজিক পদক্ষেপ সম্পর্কে জানুন।', 'Environment', '৬ ঘন্টা', 'Intermediate', 12, 'প্রফেসর রেহানা পারভিন'),
  ('ডিজিটাল সাক্ষরতা', 'Digital Literacy', 'ডিজিটাল বাংলাদেশে প্রযুক্তির সঠিক ব্যবহার ও সাইবার নিরাপত্তা শিখুন।', 'Technology', '৮ ঘন্টা', 'Beginner', 15, 'মোঃ ফারুক হোসেন'),
  ('নগর পরিকল্পনা ও অবকাঠামো', 'Urban Planning & Infrastructure', 'শহরের অবকাঠামো উন্নয়ন ও নগর পরিকল্পনা সম্পর্কে সচেতনতা বাড়ান।', 'Infrastructure', '৫ ঘন্টা', 'Advanced', 10, 'ইঞ্জিনিয়ার সালমা খানম'),
  ('বর্জ্য ব্যবস্থাপনা', 'Waste Management', 'বাড়ি ও এলাকায় সঠিক বর্জ্য ব্যবস্থাপনা পদ্ধতি শিখুন।', 'Environment', '৩ ঘন্টা', 'Beginner', 6, 'ড. মালিহা চৌধুরী');
