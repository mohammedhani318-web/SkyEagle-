-- SkyEagle 2.0 — المرحلة الثانية: جدول المقالات
-- شغّل هذا الملف في Supabase → SQL Editor

create table if not exists public.articles (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  category      text not null check (category in ('aviation','space','maintenance')),
  kind          text not null default 'article' check (kind in ('article','reference','book')),
  access        text not null default 'free'    check (access in ('free','paid')),
  read_minutes  int  not null default 3,
  published     boolean not null default false,
  published_at  date not null default current_date,
  title_ar      text not null,
  title_en      text not null,
  excerpt_ar    text not null default '',
  excerpt_en    text not null default '',
  body_ar       text not null default '',  -- الفقرات مفصولة بسطر فارغ
  body_en       text not null default '',
  created_at    timestamptz not null default now()
);

create index if not exists articles_category_idx on public.articles (category);
create index if not exists articles_published_idx on public.articles (published, published_at desc);

alter table public.articles enable row level security;

-- القراءة العامة للمقالات المنشورة فقط
drop policy if exists "Public can read published articles" on public.articles;
create policy "Public can read published articles"
  on public.articles for select
  using (published = true);

-- الكتابة ستُضاف في المرحلة الرابعة (لوحة الإدارة) عبر صلاحية admin.
-- ملاحظة: المحتوى المدفوع (access = 'paid') سيُحمى بنص كامل خاص في المرحلة الخامسة؛
-- لا تضع محتوى مدفوعًا حقيقيًا في هذا الجدول قبل ذلك لأنه قابل للقراءة علنًا.
