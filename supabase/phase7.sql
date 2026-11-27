-- ============================================================
-- المرحلة 7: حدود المعدل (rate limiting) داخل قاعدة البيانات
-- شغّله بعد phase6.sql. آمن لإعادة التشغيل.
-- ============================================================

create or replace function public.limit_community_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n int;
begin
  if public.is_staff() then return new; end if;

  if tg_table_name = 'community_threads' then
    select count(*) into v_n from public.community_threads
      where user_id = new.user_id and created_at > now() - interval '1 hour';
    if v_n >= 5 then raise exception 'rate_limited'; end if;
  else
    select count(*) into v_n from public.community_comments
      where user_id = new.user_id and created_at > now() - interval '1 minute';
    if v_n >= 5 then raise exception 'rate_limited'; end if;
    select count(*) into v_n from public.community_comments
      where user_id = new.user_id and created_at > now() - interval '1 day';
    if v_n >= 100 then raise exception 'rate_limited'; end if;
  end if;
  return new;
end;
$$;

-- يعمل قبل set_community_author؛ created_at يُعاد ضبطه هناك لكن العدّ يعتمد على صفوف قديمة فقط
drop trigger if exists threads_rate_limit on public.community_threads;
create trigger threads_rate_limit before insert on public.community_threads
  for each row execute function public.limit_community_rate();

drop trigger if exists comments_rate_limit on public.community_comments;
create trigger comments_rate_limit before insert on public.community_comments
  for each row execute function public.limit_community_rate();

create or replace function public.limit_order_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n int;
begin
  select count(*) into v_n from public.orders
    where user_id = new.user_id and status = 'pending';
  if v_n >= 10 then raise exception 'rate_limited'; end if;
  select count(*) into v_n from public.orders
    where user_id = new.user_id and created_at > now() - interval '1 hour';
  if v_n >= 20 then raise exception 'rate_limited'; end if;
  return new;
end;
$$;

drop trigger if exists orders_rate_limit on public.orders;
create trigger orders_rate_limit before insert on public.orders
  for each row execute function public.limit_order_rate();

revoke execute on function public.limit_community_rate() from public, anon, authenticated;
revoke execute on function public.limit_order_rate() from public, anon, authenticated;
