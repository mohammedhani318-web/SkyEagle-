-- SkyEagle 2.0 — المرحلة السادسة: المتجر والطلبات والتسليم الرقمي
-- شغّله في Supabase → SQL Editor (بعد schema.sql و phase3..phase5)
--
-- ملاحظة مهمة عن الدفع: هذه المرحلة لا تتصل ببوابة دفع. الطلب يُنشأ بحالة pending،
-- ويؤكد المدير الدفع يدويًا (admin_set_order_status). عند اختيار بوابة دفع لاحقًا،
-- يستدعي الـ webhook الخاص بها نفس منطق التأكيد (mark paid) من الخادم بمفتاح service_role.

-- ============================================================
-- 1) المنتجات
-- ============================================================
create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind           text not null default 'book' check (kind in ('book','file','merch','course')),
  title_ar       text not null,
  title_en       text not null,
  description_ar text not null default '',
  description_en text not null default '',
  price_cents    int  not null default 0 check (price_cents >= 0 and price_cents <= 100000000),
  image_url      text check (image_url is null or image_url ~ '^https://'),
  is_digital     boolean not null default true,
  file_path      text,                                   -- مسار الملف في bucket الخاص downloads
  course_id      uuid references public.courses(id) on delete set null,
  stock          int check (stock is null or stock >= 0), -- null = غير محدود
  published      boolean not null default false,
  created_at     timestamptz not null default now(),
  constraint products_course_check check (kind <> 'course' or (course_id is not null and is_digital))
);
create index if not exists products_published_idx on public.products (published, kind);

-- ============================================================
-- 2) الطلبات
-- ============================================================
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  number         bigint generated always as identity (start with 1001),
  user_id        uuid references auth.users(id) on delete set null,
  status         text not null default 'pending' check (status in ('pending','paid','cancelled','refunded')),
  total_cents    int  not null check (total_cents >= 0),
  payment_method text not null default 'manual',
  payment_ref    text,
  shipping       jsonb,
  created_at     timestamptz not null default now(),
  paid_at        timestamptz
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);

create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  product_id       uuid not null references public.products(id) on delete restrict,
  title_ar         text not null,
  title_en         text not null,
  unit_price_cents int  not null check (unit_price_cents >= 0),
  quantity         int  not null check (quantity between 1 and 20)
);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

-- إعدادات الموقع (تعليمات الدفع تظهر للعميل عند إتمام الطلب)
create table if not exists public.site_settings (
  key      text primary key,
  value_ar text not null default '',
  value_en text not null default ''
);
insert into public.site_settings (key, value_ar, value_en) values (
  'payment_instructions',
  'بعد إنشاء الطلب سيتواصل معك فريق SkyEagle لإرسال تفاصيل الدفع، وتُفعَّل مشترياتك فور تأكيد الدفع.',
  'After you place the order, the SkyEagle team will contact you with payment details, and your purchases are activated as soon as payment is confirmed.'
) on conflict (key) do nothing;

-- ============================================================
-- 3) دوال داخلية ومساعدة
-- ============================================================
-- هل اشترى المستخدم هذا المنتج (طلب مدفوع)؟
create or replace function public.owns_product(p_product uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.order_items i
    join public.orders o on o.id = i.order_id
    where i.product_id = p_product and o.user_id = auth.uid() and o.status = 'paid'
  );
$$;
grant execute on function public.owns_product(uuid) to anon, authenticated;

-- هل يحق للمستخدم تنزيل هذا الملف؟ (طاقم أو مشترٍ لطلب مدفوع)
create or replace function public.can_download(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.products p
    where p.file_path = p_path and p.is_digital
      and (public.is_staff() or public.owns_product(p.id))
  );
$$;
grant execute on function public.can_download(text) to anon, authenticated;

-- تفعيل المشتريات بعد الدفع: تسجيل المشتري في الدورات المشتراة
create or replace function public.fulfill_order(p_order uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.enrollments (user_id, course_id, source)
  select o.user_id, p.course_id, 'purchase'
  from public.orders o
  join public.order_items i on i.order_id = o.id
  join public.products p on p.id = i.product_id
  where o.id = p_order and o.user_id is not null and p.course_id is not null
  on conflict (user_id, course_id) do nothing;
end;
$$;
revoke all on function public.fulfill_order(uuid) from public, anon, authenticated;

create or replace function public.restore_stock(p_order uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products p
  set stock = p.stock + s.qty
  from (select product_id, sum(quantity)::int as qty from public.order_items where order_id = p_order group by product_id) s
  where p.id = s.product_id and p.stock is not null;
end;
$$;
revoke all on function public.restore_stock(uuid) from public, anon, authenticated;

-- ============================================================
-- 4) إنشاء الطلب: الأسعار تُحسب هنا من جدول المنتجات، ولا يُوثق بأي سعر من المتصفح
-- ============================================================
create or replace function public.create_order(
  p_items jsonb,
  p_shipping jsonb default null,
  p_method text default 'manual'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_el jsonb;
  v_prod public.products%rowtype;
  v_pid uuid;
  v_qty int;
  v_ids uuid[] := '{}';
  v_lines jsonb := '[]'::jsonb;
  v_total bigint := 0;
  v_ship boolean := false;
  v_ship_clean jsonb := null;
  v_order uuid;
  v_number bigint;
  v_status text;
  v_line jsonb;
begin
  if v_uid is null then raise exception 'login required'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 50 then
    raise exception 'invalid items';
  end if;
  if p_method not in ('manual','bank_transfer','cash','other') then
    raise exception 'invalid payment method';
  end if;

  -- 1) التحقق وحساب الإجمالي (مع قفل صفوف المنتجات لتفادي تجاوز المخزون)
  for v_el in select * from jsonb_array_elements(p_items) loop
    begin
      v_pid := (v_el->>'product_id')::uuid;
      v_qty := (v_el->>'qty')::int;
    exception when others then
      raise exception 'invalid items';
    end;
    if v_qty is null or v_qty < 1 or v_qty > 20 then raise exception 'invalid quantity'; end if;
    if v_pid = any (v_ids) then raise exception 'duplicate product'; end if;
    v_ids := v_ids || v_pid;

    select * into v_prod from public.products where id = v_pid and published for update;
    if not found then raise exception 'product unavailable'; end if;

    if v_prod.is_digital then v_qty := 1; end if;
    if v_prod.course_id is not null and exists (
      select 1 from public.enrollments where user_id = v_uid and course_id = v_prod.course_id
    ) then
      raise exception 'already enrolled';
    end if;
    if v_prod.stock is not null and v_prod.stock < v_qty then raise exception 'out of stock'; end if;
    if not v_prod.is_digital then v_ship := true; end if;

    v_total := v_total + v_prod.price_cents::bigint * v_qty;
    v_lines := v_lines || jsonb_build_object('id', v_pid, 'qty', v_qty);
  end loop;

  if v_total > 100000000 then raise exception 'total too large'; end if;

  -- 2) بيانات الشحن مطلوبة للمنتجات المادية فقط، وتُنظَّف لتبقى حقولًا معروفة
  if v_ship then
    if p_shipping is null or jsonb_typeof(p_shipping) <> 'object' then raise exception 'shipping required'; end if;
    v_ship_clean := jsonb_build_object(
      'name',    left(btrim(coalesce(p_shipping->>'name', '')), 120),
      'phone',   left(btrim(coalesce(p_shipping->>'phone', '')), 40),
      'address', left(btrim(coalesce(p_shipping->>'address', '')), 300),
      'city',    left(btrim(coalesce(p_shipping->>'city', '')), 100),
      'country', left(btrim(coalesce(p_shipping->>'country', '')), 100)
    );
    if (v_ship_clean->>'name') = '' or (v_ship_clean->>'phone') = ''
       or (v_ship_clean->>'address') = '' or (v_ship_clean->>'city') = ''
       or (v_ship_clean->>'country') = '' then
      raise exception 'shipping required';
    end if;
  end if;

  v_status := case when v_total = 0 then 'paid' else 'pending' end;

  insert into public.orders (user_id, status, total_cents, payment_method, shipping, paid_at)
  values (v_uid, v_status, v_total::int, p_method, v_ship_clean,
          case when v_total = 0 then now() else null end)
  returning id, number into v_order, v_number;

  for v_line in select * from jsonb_array_elements(v_lines) loop
    select * into v_prod from public.products where id = (v_line->>'id')::uuid;
    insert into public.order_items (order_id, product_id, title_ar, title_en, unit_price_cents, quantity)
    values (v_order, v_prod.id, v_prod.title_ar, v_prod.title_en, v_prod.price_cents, (v_line->>'qty')::int);
    if v_prod.stock is not null then
      update public.products set stock = stock - (v_line->>'qty')::int where id = v_prod.id;
    end if;
  end loop;

  if v_status = 'paid' then perform public.fulfill_order(v_order); end if;

  return jsonb_build_object('id', v_order, 'number', v_number, 'status', v_status, 'total_cents', v_total::int);
end;
$$;
revoke all on function public.create_order(jsonb, jsonb, text) from public, anon;
grant execute on function public.create_order(jsonb, jsonb, text) to authenticated;

-- إلغاء العميل لطلبه المعلّق
create or replace function public.cancel_my_order(p_order uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_status text;
begin
  select status into v_status from public.orders where id = p_order and user_id = auth.uid() for update;
  if not found then raise exception 'not found'; end if;
  if v_status <> 'pending' then raise exception 'cannot cancel'; end if;
  update public.orders set status = 'cancelled' where id = p_order;
  perform public.restore_stock(p_order);
end;
$$;
revoke all on function public.cancel_my_order(uuid) from public, anon;
grant execute on function public.cancel_my_order(uuid) to authenticated;

-- تغيير حالة الطلب: للمدير فقط
--   pending → paid | cancelled ،  paid → refunded
create or replace function public.admin_set_order_status(p_order uuid, p_status text, p_ref text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_old text; v_user uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select status, user_id into v_old, v_user from public.orders where id = p_order for update;
  if not found then raise exception 'not found'; end if;

  if v_old = 'pending' and p_status = 'paid' then
    update public.orders
      set status = 'paid', paid_at = now(), payment_ref = left(nullif(btrim(coalesce(p_ref, '')), ''), 200)
      where id = p_order;
    perform public.fulfill_order(p_order);
  elsif v_old = 'pending' and p_status = 'cancelled' then
    update public.orders set status = 'cancelled' where id = p_order;
    perform public.restore_stock(p_order);
  elsif v_old = 'paid' and p_status = 'refunded' then
    update public.orders set status = 'refunded' where id = p_order;
    perform public.restore_stock(p_order);
    -- سحب الوصول للدورات المشتراة في هذا الطلب
    delete from public.enrollments e
    using public.order_items i, public.products p
    where i.order_id = p_order and p.id = i.product_id
      and e.user_id = v_user and e.course_id = p.course_id and e.source = 'purchase';
  else
    raise exception 'invalid transition';
  end if;
end;
$$;
revoke all on function public.admin_set_order_status(uuid, text, text) from public, anon;
grant execute on function public.admin_set_order_status(uuid, text, text) to authenticated;

-- ============================================================
-- 5) سياسات RLS
-- ============================================================
alter table public.products      enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "products read" on public.products;
create policy "products read" on public.products for select using (
  published or public.is_staff() or public.owns_product(id)
);
drop policy if exists "products staff insert" on public.products;
create policy "products staff insert" on public.products for insert with check (public.is_staff());
drop policy if exists "products staff update" on public.products;
create policy "products staff update" on public.products for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "products admin delete" on public.products;
create policy "products admin delete" on public.products for delete using (public.is_admin());

-- الطلبات: قراءة فقط (الإنشاء والتعديل عبر الدوال أعلاه)
drop policy if exists "orders read" on public.orders;
create policy "orders read" on public.orders for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "order items read" on public.order_items;
create policy "order items read" on public.order_items for select using (
  public.is_admin()
  or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

drop policy if exists "settings read" on public.site_settings;
create policy "settings read" on public.site_settings for select using (true);
drop policy if exists "settings admin insert" on public.site_settings;
create policy "settings admin insert" on public.site_settings for insert with check (public.is_admin());
drop policy if exists "settings admin update" on public.site_settings;
create policy "settings admin update" on public.site_settings for update using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 6) تخزين الملفات الرقمية: bucket خاص (غير عام)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'downloads', 'downloads', false, 52428800,
  array[
    'application/pdf', 'application/zip', 'application/epub+zip', 'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "downloads read" on storage.objects;
create policy "downloads read" on storage.objects for select to authenticated
  using (bucket_id = 'downloads' and public.can_download(name));

drop policy if exists "downloads staff insert" on storage.objects;
create policy "downloads staff insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'downloads' and public.is_staff());

drop policy if exists "downloads staff update" on storage.objects;
create policy "downloads staff update" on storage.objects for update to authenticated
  using (bucket_id = 'downloads' and public.is_staff());

drop policy if exists "downloads staff delete" on storage.objects;
create policy "downloads staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'downloads' and public.is_staff());
