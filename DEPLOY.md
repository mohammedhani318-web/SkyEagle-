# دليل النشر — SkyEagle

## 1) Supabase
1. أنشئ مشروعاً مجانياً على supabase.com.
2. من SQL Editor شغّل بالترتيب: `schema.sql` ← `phase3.sql` ← `phase4.sql` ← `phase5.sql` ← `phase6.sql` ← `phase7.sql` (كلها داخل مجلد `supabase/`).
3. Authentication → URL Configuration: ضع Site URL = عنوان موقعك، وأضف `https://YOUR-DOMAIN/**` و`http://localhost:3000/**` إلى Redirect URLs.
4. (اختياري) فعّل Google من Authentication → Providers (يلزم Client ID/Secret من Google Cloud Console، وRedirect URI الذي تعرضه Supabase).
5. أنشئ حسابك من صفحة التسجيل، ثم اجعله أدمن من SQL Editor:
   `update public.profiles set role = 'admin' where email = 'you@example.com';`

## 2) Vercel
1. ارفع المشروع إلى GitHub ثم Import في vercel.com (الإطار يُكتشف تلقائياً: Next.js).
2. Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (مثال: https://skyeagle.com)
   لا تضع أبداً مفتاح `service_role` في متغيرات تبدأ بـ NEXT_PUBLIC.
3. Deploy.

## 3) الدومين
Vercel → Settings → Domains → أضف الدومين، ثم أضف سجلات DNS التي يطلبها (A لـ @ و CNAME لـ www) عند مزوّد الدومين. الشهادة (HTTPS) تلقائية. بعدها حدّث `NEXT_PUBLIC_SITE_URL` وSite URL في Supabase.

## 4) قائمة فحص قبل الإطلاق
- [ ] كل ملفات SQL شُغّلت بلا أخطاء
- [ ] حسابك أدمن، وتعليمات الدفع مكتوبة في /admin/orders
- [ ] جرّب: تسجيل → دورة مجانية → اختبار → شهادة
- [ ] جرّب: منتج رقمي → طلب → تأكيد من الأدمن → تحميل
- [ ] تأكد أن حساباً عادياً لا يدخل /admin
- [ ] /sitemap.xml و/robots.txt يعملان على الدومين
