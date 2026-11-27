-- SkyEagle 2.0 — المرحلة الخامسة: الدورات والاختبارات والشهادات والوظائف والمجتمع
-- شغّله في Supabase → SQL Editor (بعد schema.sql و phase3.sql و phase4.sql)

-- ============================================================
-- 1) الدورات والدروس
-- ============================================================
create table if not exists public.courses (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_ar       text not null,
  title_en       text not null,
  description_ar text not null default '',
  description_en text not null default '',
  level          text not null default 'beginner' check (level in ('beginner','intermediate','advanced')),
  access         text not null default 'free' check (access in ('free','paid')),
  price_cents    int  not null default 0 check (price_cents >= 0),
  pass_percent   int  not null default 70 check (pass_percent between 1 and 100),
  published      boolean not null default false,
  created_at     timestamptz not null default now()
);

-- عناوين الدروس عامة (للمخطط)، أما المحتوى ففي جدول منفصل محمي
create table if not exists public.lessons (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  position    int  not null default 1,
  title_ar    text not null,
  title_en    text not null,
  is_preview  boolean not null default false
);
create index if not exists lessons_course_idx on public.lessons (course_id, position);

create table if not exists public.lesson_content (
  lesson_id uuid primary key references public.lessons(id) on delete cascade,
  body_ar   text not null default '',
  body_en   text not null default '',
  video_url text
);

create table if not exists public.enrollments (
  user_id    uuid not null references auth.users(id) on delete cascade,
  course_id  uuid not null references public.courses(id) on delete cascade,
  source     text not null default 'free' check (source in ('free','purchase','admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table if not exists public.lesson_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ============================================================
-- 2) الاختبارات (الإجابات الصحيحة في جدول منفصل لا يقرؤه إلا الطاقم)
-- ============================================================
create table if not exists public.quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  position    int  not null default 1,
  question_ar text not null,
  question_en text not null,
  options     jsonb not null check (
    jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6
  )
);
create index if not exists quiz_questions_course_idx on public.quiz_questions (course_id, position);

create table if not exists public.quiz_keys (
  question_id   uuid primary key references public.quiz_questions(id) on delete cascade,
  correct_index int not null check (correct_index >= 0)
);

create table if not exists public.quiz_attempts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  course_id  uuid not null references public.courses(id) on delete cascade,
  score      int not null,
  total      int not null,
  passed     boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  user_id     uuid not null references auth.users(id) on delete cascade,
  course_id   uuid not null references public.courses(id) on delete cascade,
  holder_name text not null,
  issued_at   timestamptz not null default now(),
  unique (user_id, course_id)
);

-- ============================================================
-- 3) الوظائف والتدريب
-- ============================================================
create table if not exists public.jobs (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null default 'job' check (kind in ('job','training')),
  title_ar       text not null,
  title_en       text not null,
  company        text not null,
  location       text not null default '',
  description_ar text not null default '',
  description_en text not null default '',
  apply_url      text check (apply_url is null or apply_url ~ '^https://'),
  expires_at     date,
  published      boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- 4) المجتمع: مناقشات وتعليقات
-- ============================================================
create table if not exists public.community_threads (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '',
  title       text not null check (char_length(title) between 3 and 150),
  body        text not null check (char_length(body) between 1 and 5000),
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.community_comments (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.community_threads(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '',
  body        text not null check (char_length(body) between 1 and 3000),
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists community_comments_thread_idx on public.community_comments (thread_id, created_at);

-- الخادم هو من يحدد اسم الكاتب والتاريخ (لا يثق بما يرسله المتصفح)
create or replace function public.set_community_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.author_name := coalesce(
    nullif((select display_name from public.profiles where id = new.user_id), ''),
    'SkyEagle'
  );
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists threads_set_author on public.community_threads;
create trigger threads_set_author before insert on public.community_threads
  for each row execute function public.set_community_author();

drop trigger if exists comments_set_author on public.community_comments;
create trigger comments_set_author before insert on public.community_comments
  for each row execute function public.set_community_author();

-- ============================================================
-- 5) دوال مساعدة
-- ============================================================
create or replace function public.is_enrolled(p_course uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.enrollments where user_id = auth.uid() and course_id = p_course
  );
$$;
grant execute on function public.is_enrolled(uuid) to anon, authenticated;

-- تصحيح الاختبار على الخادم: لا تصل الإجابات الصحيحة إلى المتصفح أبدًا
create or replace function public.submit_quiz(p_course uuid, p_answers int[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_score int := 0;
  v_pass  int;
  v_passed boolean;
  r record;
  i int := 0;
begin
  if auth.uid() is null or not public.is_enrolled(p_course) then
    raise exception 'not enrolled';
  end if;

  select count(*) into v_total from public.quiz_questions where course_id = p_course;
  if v_total = 0 then raise exception 'no quiz'; end if;
  if coalesce(array_length(p_answers, 1), 0) <> v_total then raise exception 'invalid answers'; end if;

  for r in
    select q.id, k.correct_index
    from public.quiz_questions q
    join public.quiz_keys k on k.question_id = q.id
    where q.course_id = p_course
    order by q.position, q.id
  loop
    i := i + 1;
    if p_answers[i] = r.correct_index then v_score := v_score + 1; end if;
  end loop;

  select pass_percent into v_pass from public.courses where id = p_course;
  v_passed := (v_score * 100) >= (v_pass * v_total);

  insert into public.quiz_attempts (user_id, course_id, score, total, passed)
  values (auth.uid(), p_course, v_score, v_total, v_passed);

  return jsonb_build_object('score', v_score, 'total', v_total, 'passed', v_passed);
end;
$$;
revoke all on function public.submit_quiz(uuid, int[]) from public, anon;
grant execute on function public.submit_quiz(uuid, int[]) to authenticated;

-- إصدار الشهادة: بعد إتمام كل الدروس ونجاح الاختبار (إن وُجد)
create or replace function public.issue_certificate(p_course uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lessons int;
  v_done int;
  v_has_quiz boolean;
  v_code text;
  v_name text;
begin
  if auth.uid() is null or not public.is_enrolled(p_course) then
    raise exception 'not enrolled';
  end if;

  select code into v_code from public.certificates where user_id = auth.uid() and course_id = p_course;
  if v_code is not null then return v_code; end if;

  select count(*) into v_lessons from public.lessons where course_id = p_course;
  select count(*) into v_done
    from public.lesson_progress lp join public.lessons l on l.id = lp.lesson_id
    where lp.user_id = auth.uid() and l.course_id = p_course;
  if v_lessons = 0 or v_done < v_lessons then raise exception 'lessons incomplete'; end if;

  select exists (select 1 from public.quiz_questions where course_id = p_course) into v_has_quiz;
  if v_has_quiz and not exists (
    select 1 from public.quiz_attempts
    where user_id = auth.uid() and course_id = p_course and passed
  ) then
    raise exception 'quiz not passed';
  end if;

  select coalesce(nullif(display_name, ''), 'SkyEagle member') into v_name
    from public.profiles where id = auth.uid();

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  insert into public.certificates (code, user_id, course_id, holder_name)
  values (v_code, auth.uid(), p_course, coalesce(v_name, 'SkyEagle member'));
  return v_code;
end;
$$;
revoke all on function public.issue_certificate(uuid) from public, anon;
grant execute on function public.issue_certificate(uuid) to authenticated;

-- التحقق العام من شهادة بواسطة الرمز (يكشف الاسم والدورة والتاريخ فقط)
create or replace function public.verify_certificate(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'holder_name', c.holder_name,
    'issued_at', c.issued_at,
    'title_ar', co.title_ar,
    'title_en', co.title_en
  )
  from public.certificates c
  join public.courses co on co.id = c.course_id
  where c.code = upper(p_code)
  limit 1;
$$;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- ============================================================
-- 6) سياسات RLS
-- ============================================================
alter table public.courses            enable row level security;
alter table public.lessons            enable row level security;
alter table public.lesson_content     enable row level security;
alter table public.enrollments        enable row level security;
alter table public.lesson_progress    enable row level security;
alter table public.quiz_questions     enable row level security;
alter table public.quiz_keys          enable row level security;
alter table public.quiz_attempts      enable row level security;
alter table public.certificates       enable row level security;
alter table public.jobs               enable row level security;
alter table public.community_threads  enable row level security;
alter table public.community_comments enable row level security;

-- courses
drop policy if exists "courses read" on public.courses;
create policy "courses read" on public.courses for select using (published or public.is_staff());
drop policy if exists "courses staff insert" on public.courses;
create policy "courses staff insert" on public.courses for insert with check (public.is_staff());
drop policy if exists "courses staff update" on public.courses;
create policy "courses staff update" on public.courses for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "courses admin delete" on public.courses;
create policy "courses admin delete" on public.courses for delete using (public.is_admin());

-- lessons (العناوين)
drop policy if exists "lessons read" on public.lessons;
create policy "lessons read" on public.lessons for select using (
  public.is_staff()
  or exists (select 1 from public.courses c where c.id = course_id and c.published)
);
drop policy if exists "lessons staff insert" on public.lessons;
create policy "lessons staff insert" on public.lessons for insert with check (public.is_staff());
drop policy if exists "lessons staff update" on public.lessons;
create policy "lessons staff update" on public.lessons for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "lessons staff delete" on public.lessons;
create policy "lessons staff delete" on public.lessons for delete using (public.is_staff());

-- lesson_content (المحتوى المحمي: للطاقم، أو دروس المعاينة، أو المسجَّلين فقط)
drop policy if exists "content read" on public.lesson_content;
create policy "content read" on public.lesson_content for select using (
  public.is_staff()
  or exists (
    select 1 from public.lessons l join public.courses c on c.id = l.course_id
    where l.id = lesson_id and c.published and (l.is_preview or public.is_enrolled(c.id))
  )
);
drop policy if exists "content staff insert" on public.lesson_content;
create policy "content staff insert" on public.lesson_content for insert with check (public.is_staff());
drop policy if exists "content staff update" on public.lesson_content;
create policy "content staff update" on public.lesson_content for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "content staff delete" on public.lesson_content;
create policy "content staff delete" on public.lesson_content for delete using (public.is_staff());

-- enrollments: التسجيل الذاتي في الدورات المجانية المنشورة فقط.
-- الدورات المدفوعة: يضيفها المدير الآن، وبوابة الدفع في المرحلة السادسة.
drop policy if exists "enroll read own" on public.enrollments;
create policy "enroll read own" on public.enrollments for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "enroll free self" on public.enrollments;
create policy "enroll free self" on public.enrollments for insert with check (
  auth.uid() = user_id and source = 'free'
  and exists (select 1 from public.courses c where c.id = course_id and c.published and c.access = 'free')
);
drop policy if exists "enroll admin grant" on public.enrollments;
create policy "enroll admin grant" on public.enrollments for insert with check (public.is_admin());

-- lesson_progress
drop policy if exists "progress read own" on public.lesson_progress;
create policy "progress read own" on public.lesson_progress for select using (auth.uid() = user_id);
drop policy if exists "progress insert own" on public.lesson_progress;
create policy "progress insert own" on public.lesson_progress for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.lessons l where l.id = lesson_id and public.is_enrolled(l.course_id))
);
drop policy if exists "progress delete own" on public.lesson_progress;
create policy "progress delete own" on public.lesson_progress for delete using (auth.uid() = user_id);

-- quiz_questions: للمسجَّلين في الدورة المنشورة وللطاقم
drop policy if exists "questions read" on public.quiz_questions;
create policy "questions read" on public.quiz_questions for select using (
  public.is_staff()
  or (public.is_enrolled(course_id)
      and exists (select 1 from public.courses c where c.id = course_id and c.published))
);
drop policy if exists "questions staff insert" on public.quiz_questions;
create policy "questions staff insert" on public.quiz_questions for insert with check (public.is_staff());
drop policy if exists "questions staff update" on public.quiz_questions;
create policy "questions staff update" on public.quiz_questions for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "questions staff delete" on public.quiz_questions;
create policy "questions staff delete" on public.quiz_questions for delete using (public.is_staff());

-- quiz_keys: الطاقم فقط
drop policy if exists "keys staff read" on public.quiz_keys;
create policy "keys staff read" on public.quiz_keys for select using (public.is_staff());
drop policy if exists "keys staff insert" on public.quiz_keys;
create policy "keys staff insert" on public.quiz_keys for insert with check (public.is_staff());
drop policy if exists "keys staff update" on public.quiz_keys;
create policy "keys staff update" on public.quiz_keys for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "keys staff delete" on public.quiz_keys;
create policy "keys staff delete" on public.quiz_keys for delete using (public.is_staff());

-- quiz_attempts و certificates: قراءة فقط (الكتابة عبر الدوال أعلاه)
drop policy if exists "attempts read own" on public.quiz_attempts;
create policy "attempts read own" on public.quiz_attempts for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "certs read own" on public.certificates;
create policy "certs read own" on public.certificates for select using (auth.uid() = user_id or public.is_admin());

-- jobs
drop policy if exists "jobs read" on public.jobs;
create policy "jobs read" on public.jobs for select using (published or public.is_staff());
drop policy if exists "jobs staff insert" on public.jobs;
create policy "jobs staff insert" on public.jobs for insert with check (public.is_staff());
drop policy if exists "jobs staff update" on public.jobs;
create policy "jobs staff update" on public.jobs for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "jobs admin delete" on public.jobs;
create policy "jobs admin delete" on public.jobs for delete using (public.is_admin());

-- community_threads
drop policy if exists "threads read" on public.community_threads;
create policy "threads read" on public.community_threads for select using (
  not hidden or public.is_staff() or auth.uid() = user_id
);
drop policy if exists "threads insert own" on public.community_threads;
create policy "threads insert own" on public.community_threads for insert with check (
  auth.uid() = user_id and hidden = false
);
drop policy if exists "threads staff update" on public.community_threads;
create policy "threads staff update" on public.community_threads for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "threads delete" on public.community_threads;
create policy "threads delete" on public.community_threads for delete using (
  auth.uid() = user_id or public.is_staff()
);

-- community_comments
drop policy if exists "comments read" on public.community_comments;
create policy "comments read" on public.community_comments for select using (
  not hidden or public.is_staff() or auth.uid() = user_id
);
drop policy if exists "comments insert own" on public.community_comments;
create policy "comments insert own" on public.community_comments for insert with check (
  auth.uid() = user_id and hidden = false
  and exists (select 1 from public.community_threads t where t.id = thread_id and not t.hidden)
);
drop policy if exists "comments staff update" on public.community_comments;
create policy "comments staff update" on public.community_comments for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "comments delete" on public.community_comments;
create policy "comments delete" on public.community_comments for delete using (
  auth.uid() = user_id or public.is_staff()
);

-- ============================================================
-- 7) دورة تجريبية مجانية (اختيارية) لتجربة النظام
-- ============================================================
do $$
declare
  c uuid; l1 uuid := gen_random_uuid(); l2 uuid := gen_random_uuid(); l3 uuid := gen_random_uuid();
  q1 uuid := gen_random_uuid(); q2 uuid := gen_random_uuid(); q3 uuid := gen_random_uuid();
begin
  if exists (select 1 from public.courses where slug = 'intro-to-aviation') then return; end if;

  insert into public.courses (slug, title_ar, title_en, description_ar, description_en, level, access, published)
  values (
    'intro-to-aviation',
    'مدخل إلى هندسة الطيران',
    'Introduction to Aviation Engineering',
    'دورة تمهيدية قصيرة تعرّفك بأساسيات الطيران: القوى المؤثرة، والجناح، ومكونات الطائرة.',
    'A short introductory course covering aviation basics: the forces of flight, the wing and aircraft components.',
    'beginner', 'free', true
  ) returning id into c;

  insert into public.lessons (id, course_id, position, title_ar, title_en, is_preview) values
    (l1, c, 1, 'القوى الأربع للطيران', 'The Four Forces of Flight', true),
    (l2, c, 2, 'الجناح وقوة الرفع', 'The Wing and Lift', false),
    (l3, c, 3, 'مكونات الطائرة الأساسية', 'Main Aircraft Components', false);

  insert into public.lesson_content (lesson_id, body_ar, body_en) values
  (l1,
   E'تتأثر الطائرة بأربع قوى: الرفع والوزن والدفع والسحب.\n\nفي الطيران المستقيم المنتظم عند ارتفاع ثابت يتساوى الرفع مع الوزن ويتساوى الدفع مع السحب.',
   E'An aircraft is acted on by four forces: lift, weight, thrust and drag.\n\nIn steady, level flight lift equals weight and thrust equals drag.'),
  (l2,
   E'المقطع الجناحي هو شكل مقطع الجناح، وهو يولّد الرفع بخلق فرق ضغط بين سطحيه العلوي والسفلي.\n\nتزداد قوة الرفع بزيادة زاوية الهجوم حتى حدٍّ معين، وبعده يحدث الانهيار (Stall).',
   E'An airfoil is the cross-section of a wing; it generates lift by creating a pressure difference between its upper and lower surfaces.\n\nLift increases with angle of attack up to a limit, beyond which a stall occurs.'),
  (l3,
   E'يتكون هيكل الطائرة من الجسم والأجنحة ومجموعة الذيل وأسطح التحكم ومعدات الهبوط.\n\nتُستخدم سبائك الألومنيوم والمواد المركبة لتحقيق أخف وزن ممكن مع تحمّل الأحمال.',
   E'The airframe consists of the fuselage, wings, tail assembly, control surfaces and landing gear.\n\nAluminum alloys and composites are used to achieve the lowest possible weight while carrying the loads.');

  insert into public.quiz_questions (id, course_id, position, question_ar, question_en, options) values
  (q1, c, 1, 'ما القوة التي تقاوم حركة الطائرة للأمام؟', 'Which force resists the aircraft''s forward motion?',
   '[{"ar":"الرفع","en":"Lift"},{"ar":"السحب","en":"Drag"},{"ar":"الدفع","en":"Thrust"}]'::jsonb),
  (q2, c, 2, 'ماذا يحدث عند تجاوز زاوية الهجوم الحرجة؟', 'What happens when the critical angle of attack is exceeded?',
   '[{"ar":"يزداد الرفع باستمرار","en":"Lift keeps increasing"},{"ar":"ينفصل الهواء ويحدث انهيار","en":"Airflow separates and a stall occurs"},{"ar":"ينعدم الوزن","en":"Weight disappears"}]'::jsonb),
  (q3, c, 3, 'أي مما يلي من أسطح التحكم؟', 'Which of the following is a control surface?',
   '[{"ar":"عجلة الهبوط","en":"Landing wheel"},{"ar":"المروحة","en":"Fan"},{"ar":"الجنيحات","en":"Ailerons"}]'::jsonb);

  insert into public.quiz_keys (question_id, correct_index) values (q1, 1), (q2, 1), (q3, 2);
end $$;
