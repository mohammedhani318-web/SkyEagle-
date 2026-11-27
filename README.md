# SkyEagle 2.0 — المرحلة الأولى

Next.js + TypeScript + Tailwind CSS + next-intl (العربية RTL / English LTR).

## التشغيل
```bash
npm install
npm run dev      # http://localhost:3000  (يوجّه إلى /ar)
npm run build
```

## البنية
- `messages/ar.json`, `messages/en.json` — كل النصوص (أضف `ru.json` ثم أضف `ru` في `src/i18n/routing.ts` للروسية).
- `src/app/[locale]/page.tsx` — الصفحة الرئيسية.
- `src/app/[locale]/[section]/page.tsx` — صفحات "قريبًا" للأقسام (تُستبدل تدريجيًا في المراحل التالية).
- `src/components/` — الترويسة والتذييل والشعار.
- الألوان في `src/app/[locale]/globals.css` (كحلي/ذهبي/أزرق سماوي).

## النشر
ارفع المشروع إلى GitHub ثم اربطه بـ Vercel (الخطة المجانية).

## المرحلة الثانية: المقالات والبحث
- `src/data/articles.ts` — محتوى تجريبي (9 مواد). يُستخدم تلقائيًا إذا لم يُضبط Supabase.
- `supabase/schema.sql` — شغّله في Supabase SQL Editor لإنشاء جدول `articles` (قراءة عامة للمنشور فقط).
- انسخ `.env.example` إلى `.env.local` وأضف مفاتيح Supabase لتفعيل القراءة من القاعدة.
- البحث: `/ar/search?q=...` يدعم تطبيع العربية (الهمزات، التاء المربوطة، التشكيل).
- `/library?kind=article|reference|book` — فلتر المكتبة.

## المرحلة الثالثة: الحسابات
1. أنشئ مشروعًا مجانيًا في Supabase، وانسخ `Project URL` و`anon key` إلى `.env.local` (انظر `.env.example`).
2. شغّل `supabase/schema.sql` ثم `supabase/phase3.sql` في SQL Editor.
3. Authentication → URL Configuration: أضف `http://localhost:3000/**` ورابط موقعك على Vercel إلى Redirect URLs.
4. لتفعيل Google: Authentication → Providers → Google، وأنشئ OAuth Client في Google Cloud Console وضع Redirect URI الذي يعرضه Supabase.
5. الصفحات: `/login` `/signup` `/profile` `/favorites`. زر المفضلة في صفحة كل مقال.

## المرحلة الرابعة: لوحة الإدارة (`/admin`)
1. شغّل `supabase/phase4.sql` في SQL Editor (بعد الملفين السابقين).
2. سجّل حسابًا في الموقع، ثم نفّذ مرة واحدة في SQL Editor (غيّر البريد):
   `update public.profiles set role = 'admin' where email = 'you@example.com';`
3. ادخل إلى `/ar/admin`. أول مرة: المقالات ← "استيراد المحتوى التجريبي" لنقل المواد التجريبية إلى القاعدة.

الأدوار: `admin` (كل شيء) · `editor` (المقالات والوسائط فقط، بلا حذف ولا إدارة مستخدمين) · `user`.
الحماية الفعلية في سياسات RLS داخل القاعدة، وصفحات الإدارة تتحقق أيضًا من جهة الخادم.
تغيير الدور يتم فقط عبر الدالة `set_user_role` (للمدير، ولا يغيّر دوره بنفسه).
تظهر تعديلات المقالات في صفحات الأقسام خلال دقيقة (revalidate = 60).

## المرحلة الخامسة: الدورات والوظائف والمجتمع
1. شغّل `supabase/phase5.sql` في SQL Editor (بعد الملفات السابقة). يُنشئ الجداول والسياسات ودورة تجريبية مجانية "intro-to-aviation".
2. الصفحات: `/courses` · `/courses/[slug]` · `/courses/[slug]/learn` · `/certificates/[code]` · `/jobs` · `/community`.
3. الإدارة: `/admin/courses` (دروس + أسئلة اختبار في محرر واحد) · `/admin/jobs` · `/admin/comments` (إخفاء/حذف).

**الحماية:** نص الدروس في جدول منفصل لا يقرؤه إلا المسجَّل أو دروس المعاينة. الإجابات الصحيحة في جدول لا يقرؤه إلا الطاقم، والتصحيح يتم داخل القاعدة (`submit_quiz`). الشهادة لا تُصدر إلا بعد إتمام كل الدروس والنجاح (`issue_certificate`)، ويمكن لأي شخص التحقق منها برمزها (`/certificates/CODE`).

**الدورات المدفوعة (حتى المرحلة 6):** لا يستطيع المستخدم التسجيل فيها بنفسه. لمنح وصول يدويًا نفّذ في SQL Editor:
```sql
insert into public.enrollments (user_id, course_id, source)
select p.id, c.id, 'admin'
from public.profiles p, public.courses c
where p.email = 'student@example.com' and c.slug = 'course-slug';
```
السعر يُعرض بالدولار (price_cents ÷ 100).

## المرحلة 6 — المتجر والسلة والطلبات

1. شغّل `supabase/phase6.sql` في SQL Editor بعد `phase5.sql`.
2. من `/admin/orders` اكتب تعليمات الدفع (عربي/إنجليزي) — تظهر للعميل في صفحة إتمام الطلب.
3. أضف المنتجات من `/admin/products` (كتب، ملفات رقمية، منتجات مادية، دورات مدفوعة).
   - الدورات المدفوعة تُباع عبر منتج من نوع `course` مرتبط بالدورة.
   - الملفات الرقمية تُرفع إلى bucket خاص `downloads` ولا تُحمَّل إلا بعد تأكيد الدفع (رابط موقّع 60 ثانية).
4. الدفع يدوي حالياً: الطلب يبدأ `pending` ثم يؤكده الأدمن (`admin_set_order_status`) فيُفعَّل التحميل/الالتحاق.
   بوابة دفع لاحقاً تستدعي نفس المنطق عبر webhook بمفتاح service-role.
5. العملة: دولار أمريكي (USD). الأسعار تُحسب دائماً في الخادم داخل `create_order`.
6. السلة محفوظة في المتصفح (`skyeagle-cart-v1`).

## المرحلة 7 — التقوية والنشر
- ترويسات أمان (HSTS، X-Frame-Options، nosniff، Referrer/Permissions-Policy)، وإخفاء `X-Powered-By`.
- `supabase/phase7.sql`: حدود معدل داخل القاعدة — المجتمع (5 مناقشات/ساعة، 5 تعليقات/دقيقة، 100/يوم؛ الطاقم مستثنى) والطلبات (10 معلّقة كحد أقصى، 20/ساعة).
- `sitemap.xml` و`robots.txt` (يعتمدان على `NEXT_PUBLIC_SITE_URL`).
- راجع `DEPLOY.md` لخطوات Supabase وVercel والدومين.
