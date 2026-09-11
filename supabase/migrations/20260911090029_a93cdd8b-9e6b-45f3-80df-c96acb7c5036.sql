CREATE TABLE public.site_sections (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.site_sections TO anon, authenticated;
GRANT ALL ON public.site_sections TO service_role;
ALTER TABLE public.site_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site sections are public" ON public.site_sections FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.site_faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_en text NOT NULL DEFAULT '',
  question_ar text NOT NULL DEFAULT '',
  answer_en text NOT NULL DEFAULT '',
  answer_ar text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_faq TO anon, authenticated;
GRANT ALL ON public.site_faq TO service_role;
ALTER TABLE public.site_faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enabled faq is public" ON public.site_faq FOR SELECT TO anon, authenticated USING (enabled);

CREATE TABLE public.site_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot text NOT NULL DEFAULT 'gallery',
  url text NOT NULL,
  storage_path text,
  alt_en text NOT NULL DEFAULT '',
  alt_ar text NOT NULL DEFAULT '',
  caption_en text NOT NULL DEFAULT '',
  caption_ar text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_media TO anon, authenticated;
GRANT ALL ON public.site_media TO service_role;
ALTER TABLE public.site_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enabled media is public" ON public.site_media FOR SELECT TO anon, authenticated USING (enabled);

CREATE TABLE public.site_seo (
  page text PRIMARY KEY,
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  keywords text NOT NULL DEFAULT '',
  canonical_url text NOT NULL DEFAULT '',
  og_image text NOT NULL DEFAULT '',
  og_title text NOT NULL DEFAULT '',
  og_description text NOT NULL DEFAULT '',
  twitter_title text NOT NULL DEFAULT '',
  twitter_description text NOT NULL DEFAULT '',
  twitter_image text NOT NULL DEFAULT '',
  noindex boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.site_seo TO anon, authenticated;
GRANT ALL ON public.site_seo TO service_role;
ALTER TABLE public.site_seo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo is public" ON public.site_seo FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'unknown',
  event_type text NOT NULL DEFAULT '',
  ok boolean NOT NULL DEFAULT false,
  status_code integer,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_site_faq_updated BEFORE UPDATE ON public.site_faq FOR EACH ROW EXECUTE FUNCTION public.tg_update_updated_at();
CREATE TRIGGER trg_site_media_updated BEFORE UPDATE ON public.site_media FOR EACH ROW EXECUTE FUNCTION public.tg_update_updated_at();

INSERT INTO public.site_sections (id, data) VALUES
 ('hero', '{"title_en":"Find. Share. Park.","title_ar":"ابحث. شارك. اركن.","subtitle_en":"AndiPark is a community-powered parking service. Drivers share the spot they are about to leave, so someone nearby can take it.","subtitle_ar":"AndiPark خدمة مواقف يقودها المجتمع. يشارك السائقون موقفهم قبل المغادرة ليستفيد منه سائق قريب.","cta_en":"Get AndiPark","cta_ar":"احصل على AndiPark","cta_url":"/app"}'::jsonb),
 ('how', '{"title_en":"How it works","title_ar":"كيف يعمل","steps":[{"key":"find","title_en":"Find","title_ar":"ابحث","desc_en":"See parking opportunities appearing around you in real time.","desc_ar":"شاهد فرص المواقف تظهر حولك مباشرة.","enabled":true},{"key":"share","title_en":"Share","title_ar":"شارك","desc_en":"Tell the community when you are about to leave your spot.","desc_ar":"أخبر المجتمع عندما تكون على وشك مغادرة موقفك.","enabled":true},{"key":"connect","title_en":"Connect","title_ar":"تواصل","desc_en":"Agree on the handoff time with the other driver in chat.","desc_ar":"اتفق مع السائق الآخر على وقت التسليم عبر المحادثة.","enabled":true},{"key":"park","title_en":"Park","title_ar":"اركن","desc_en":"Arrive, take the spot and complete the handoff.","desc_ar":"صل، خذ الموقف وأكمل عملية التسليم.","enabled":true}]}'::jsonb),
 ('features', '{"title_en":"Why drivers use AndiPark","title_ar":"لماذا يستخدم السائقون AndiPark","items":[{"key":"realtime","title_en":"Real-time parking opportunities","title_ar":"فرص مواقف لحظية","desc_en":"Spots appear the moment a driver announces they are leaving.","desc_ar":"تظهر المواقف لحظة إعلان السائق عن مغادرته.","enabled":true},{"key":"community","title_en":"Community-powered","title_ar":"مدعوم بالمجتمع","desc_en":"Every spot comes from another driver, not from a paid operator.","desc_ar":"كل موقف يأتي من سائق آخر وليس من مشغل تجاري.","enabled":true},{"key":"nearby","title_en":"Nearby spots first","title_ar":"الأقرب أولاً","desc_en":"The map highlights the closest opportunities around you.","desc_ar":"تبرز الخريطة أقرب الفرص حولك.","enabled":true},{"key":"handoff","title_en":"Parking handoff","title_ar":"تسليم الموقف","desc_en":"Request, confirm and hand over a spot without guesswork.","desc_ar":"اطلب وأكد وسلّم الموقف دون تخمين.","enabled":true},{"key":"rewards","title_en":"Rewards","title_ar":"مكافآت","desc_en":"Earn AndiPoints when you share a spot with the community.","desc_ar":"اكسب نقاط AndiPoints عند مشاركة موقفك.","enabled":true},{"key":"fast","title_en":"Fast experience","title_ar":"تجربة سريعة","desc_en":"Map-first, mobile-first, in Arabic and English.","desc_ar":"خريطة أولاً، جوال أولاً، بالعربية والإنجليزية.","enabled":true}]}'::jsonb),
 ('rewards', '{"title_en":"Earn while you help","title_ar":"اكسب بينما تساعد","desc_en":"Sharing a spot earns you AndiPoints. Reserving a spot spends them. Invite a friend and you both get points.","desc_ar":"مشاركة موقفك تكسبك نقاط AndiPoints، وحجز موقف يستهلكها. ادعُ صديقاً لتحصلا معاً على نقاط.","cta_en":"Open the app","cta_ar":"افتح التطبيق","cta_url":"/app"}'::jsonb),
 ('preview', '{"title_en":"Inside the app","title_ar":"داخل التطبيق","desc_en":"","desc_ar":""}'::jsonb),
 ('download', '{"title_en":"Get AndiPark","title_ar":"احصل على AndiPark","desc_en":"Open AndiPark in your browser today. Store apps are on the way.","desc_ar":"افتح AndiPark من المتصفح اليوم. تطبيقات المتاجر قادمة قريباً.","app_store_url":"","google_play_url":"","qr_url":"","web_cta_en":"Open web app","web_cta_ar":"افتح تطبيق الويب"}'::jsonb),
 ('stats', '{"dynamic_enabled":true,"manual":[]}'::jsonb),
 ('footer', '{"copyright_en":"AndiPark — Community-powered parking service.","copyright_ar":"AndiPark — خدمة مواقف يقودها المجتمع.","contact_email":"","links":[],"social":[]}'::jsonb),
 ('settings', '{"website_enabled":true,"default_language":"en","default_theme":"system","contact_email":"","main_domain":"","analytics_id":""}'::jsonb);

INSERT INTO public.site_seo (page, title_en, title_ar, description_en, description_ar) VALUES
 ('home','AndiPark — Find. Share. Park.','AndiPark — ابحث. شارك. اركن.','AndiPark is a community-powered parking service: drivers share the spot they are leaving so someone nearby can park.','AndiPark خدمة مواقف يقودها المجتمع: يشارك السائقون موقفهم عند المغادرة ليتمكن سائق قريب من الركن.');

INSERT INTO public.site_faq (question_en, question_ar, answer_en, answer_ar, sort_order) VALUES
 ('What is AndiPark?','ما هو AndiPark؟','AndiPark is a community-powered parking service where drivers share the spot they are about to leave with drivers looking for parking nearby.','AndiPark خدمة مواقف يقودها المجتمع، يشارك فيها السائقون الموقف الذي سيغادرونه مع سائقين يبحثون عن موقف قريب.',1),
 ('Is AndiPark affiliated with any parking authority?','هل AndiPark تابع لأي جهة مواقف رسمية؟','No. AndiPark is an independent community service and is not affiliated with, endorsed by, or a replacement for any public parking operator or government service.','لا. AndiPark خدمة مجتمعية مستقلة وليست تابعة لأي مشغل مواقف عام أو جهة حكومية ولا تحل محلها.',2),
 ('How do I share my parking spot?','كيف أشارك موقفي؟','Open the app, tap “I''m leaving”, confirm your location and choose when you will leave. Nearby drivers can then request the spot.','افتح التطبيق، اضغط «سأغادر»، أكد موقعك واختر وقت مغادرتك، ثم يمكن للسائقين القريبين طلب الموقف.',3),
 ('What are AndiPoints?','ما هي نقاط AndiPoints؟','AndiPoints are earned when you share a spot and spent when you take one. Referrals also earn points.','تُكتسب نقاط AndiPoints عند مشاركة موقف وتُستهلك عند أخذ موقف، كما تمنح الدعوات نقاطاً.',4);