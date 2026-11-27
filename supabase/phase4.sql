-- SkyEagle 2.0 — المرحلة الرابعة: الأدوار ولوحة الإدارة
-- شغّله في Supabase → SQL Editor (بعد schema.sql و phase3.sql)

-- ============================================================
-- 1) الأدوار + البريد في جدول profiles
-- ============================================================
alter table public.profiles add column if not exists role  text not null default 'user';
alter table public.profiles add column if not exists email text;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('user', 'editor', 'admin'));

-- تعبئة الملفات الناقصة والبريد للحسابات الموجودة
insert into public.profiles (id, display_name, email)
select u.id,
       coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1)),
       u.email
from auth.users u
on conflict (id) do nothing;

update public.profiles p set email = u.email
from auth.users u where u.id = p.id and p.email is distinct from u.email;

-- الـ trigger يحفظ البريد أيضًا
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(new.email, '@', 1)
    ),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ============================================================
-- 2) إغلاق ثغرة رفع الصلاحيات:
--    لا يجوز لمستخدم تعديل عمود role أو إنشاء ملف بدور مختلف.
--    نحصر صلاحيات الكتابة على الأعمدة الآمنة فقط.
-- ============================================================
revoke insert, update on public.profiles from authenticated, anon;
grant update (display_name, bio, avatar_url, updated_at) on public.profiles to authenticated;

drop policy if exists "Users insert their own profile" on public.profiles;

-- ============================================================
-- 3) دوال الصلاحيات (security definer لتجنّب التكرار في RLS)
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'));
$$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;

-- تغيير دور مستخدم: للمدير فقط، ولا يغيّر دوره بنفسه (يضمن بقاء مدير واحد على الأقل)
create or replace function public.set_user_role(target uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if new_role not in ('user', 'editor', 'admin') then
    raise exception 'invalid role';
  end if;
  if target = auth.uid() then
    raise exception 'cannot change your own role';
  end if;
  update public.profiles set role = new_role where id = target;
end;
$$;

revoke all on function public.set_user_role(uuid, text) from public, anon;
grant execute on function public.set_user_role(uuid, text) to authenticated;

-- ============================================================
-- 4) سياسات profiles للمدير
-- ============================================================
drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
  on public.profiles for select using (public.is_admin());

-- ============================================================
-- 5) سياسات articles للإدارة
-- ============================================================
drop policy if exists "Staff read all articles" on public.articles;
create policy "Staff read all articles"
  on public.articles for select using (public.is_staff());

drop policy if exists "Staff insert articles" on public.articles;
create policy "Staff insert articles"
  on public.articles for insert with check (public.is_staff());

drop policy if exists "Staff update articles" on public.articles;
create policy "Staff update articles"
  on public.articles for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Admins delete articles" on public.articles;
create policy "Admins delete articles"
  on public.articles for delete using (public.is_admin());

-- إحصاء المفضلة للمدير فقط (قراءة العدد)
drop policy if exists "Admins read all favorites" on public.favorites;
create policy "Admins read all favorites"
  on public.favorites for select using (public.is_admin());

-- ============================================================
-- 6) مكتبة الوسائط (صور وفيديو) — الرفع والحذف للطاقم فقط
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 52428800,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Staff list media" on storage.objects;
create policy "Staff list media"
  on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_staff());

drop policy if exists "Staff upload media" on storage.objects;
create policy "Staff upload media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_staff());

drop policy if exists "Staff delete media" on storage.objects;
create policy "Staff delete media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_staff());

-- ============================================================
-- 7) تعيين أول مدير (نفّذ يدويًا مرة واحدة بعد تسجيلك في الموقع)
--    غيّر البريد إلى بريدك:
-- ============================================================
-- update public.profiles set role = 'admin' where email = 'you@example.com';
