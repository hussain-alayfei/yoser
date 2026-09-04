/** onboarding يسر: تعريف مختصر يطمئن المستفيد ويشرح المسار قبل جمع البيانات. */
import { ArrowLeft, Building2, CheckCircle2, FileText, Home, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const logo = "/manus-storage/sakan360-logo_9d61e873.png";

const slides = [
  { eyebrow: "أهلًا بك في يسر", title: "رحلتك السكنية أوضح من أول خطوة", body: "يساعدك يسر على فهم وضعك السكني، معرفة البرامج المرشح لها، ثم متابعة طلبك والبيت بعد التسليم.", icon: Sparkles },
  { eyebrow: "اعرف خياراتك", title: "عبّئ بياناتك واعرف ما يناسبك", body: "نبدأ ببيانات مختصرة عن الأسرة والسكن والدخل، ثم نعرض لك مطابقة إرشادية واضحة دون وعود بقبول نهائي.", icon: CheckCircle2 },
  { eyebrow: "تابع كل ما يهمك", title: "من إنشاء الطلب إلى متابعة البيت", body: "بعد إنشاء الطلب تتابع مرحلته، وبعد التسليم تفتح تجربة وحدتك وبلاغات الصيانة والتذكيرات الوقائية.", icon: Home },
];

export function OnboardingPage() {
  const [, navigate] = useLocation();
  const [active, setActive] = useState(0);
  const slide = slides[active];
  const Icon = slide.icon;
  const last = active === slides.length - 1;
  return <main className="onboarding-page" dir="rtl">
    <div className="onboarding-top"><div className="onboarding-brand"><img src={logo} alt="شعار يسر" /><strong>يسر</strong><span>رحلتك السكنية في مكان واحد</span></div><div className="onboarding-actions"><button className="onboarding-login" onClick={() => navigate("/login")}>دخول</button><button className="onboarding-skip" onClick={() => navigate("/start")}>تخطي <ArrowLeft size={16} /></button></div></div>
    <section className="onboarding-stage"><div className="onboarding-art"><div className="onboarding-glow" /><div className="onboarding-icon"><Icon size={38} /></div><div className="onboarding-route"><span>01</span><i /><span>02</span><i /><span>03</span></div><div className="onboarding-art-note"><Building2 size={16} /> ملف واحد، رحلة متصلة</div></div><div className="onboarding-copy"><p className="eyebrow">{slide.eyebrow}</p><h1>{slide.title}</h1><p className="onboarding-body">{slide.body}</p><div className="onboarding-dots" role="tablist" aria-label="شرائح التعريف">{slides.map((item, index) => <button key={item.eyebrow} aria-label={`الشريحة ${index + 1}`} aria-selected={index === active} className={index === active ? "active" : ""} onClick={() => setActive(index)} />)}</div><button className="primary-btn onboarding-cta" onClick={() => last ? navigate("/start") : setActive((current) => current + 1)}>{last ? "ابدأ رحلتك" : "التالي"} <ArrowLeft size={18} /></button><p className="onboarding-trust"><FileText size={15} /> نموذج أولي توضيحي — القرار النهائي يعتمد على مراجعة الجهة المختصة.</p></div></section>
  </main>;
}
