-- SkyEagle 2.0 — المرحلة الثالثة: الملفات الشخصية والمفضلة والصور
-- شغّله في Supabase → SQL Editor (بعد schema.sql)

-- 1) الملفات الشخصية
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  bio          text not null default '',
  avatar_url   text,
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by their owner" on public.profiles;
create policy "Profiles are readable by their owner"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users insert their own profile" on public.profiles;
create policy "Users insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- إنشاء الملف الشخصي تلقائيًا عند التسجيل
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) المفضلة
create table if not exists public.favorites (
  user_id      uuid not null references auth.users(id) on delete cascade,
  article_slug text not null,
  created_at   timestamptz not null default now(),
  primary key (user_id, article_slug)
);

alter table public.favorites enable row level security;

drop policy if exists "Users read their favorites" on public.favorites;
create policy "Users read their favorites"
  on public.favorites for select using (auth.uid() = user_id);

drop policy if exists "Users add their favorites" on public.favorites;
create policy "Users add their favorites"
  on public.favorites for insert with check (auth.uid() = user_id);

drop policy if exists "Users remove their favorites" on public.favorites;
create policy "Users remove their favorites"
  on public.favorites for delete using (auth.uid() = user_id);

-- 3) صور الملفات الشخصية (حد 2MB، صور فقط)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
