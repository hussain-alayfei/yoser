/** أسلوب خريطة الاستقرار: دخول هادئ يضع الطمأنينة والمسار السكني قبل أي تعقيد تشغيلي. */
import { ArrowLeft, CheckCircle2, LockKeyhole, Phone, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const logo = "/brand/yusr-logo.svg";
const loginVisual = "linear-gradient(150deg, #0f7d6b 0%, #0b5a4d 55%, #08403a 100%)";

export function LoginPage() {
  const [, navigate] = useLocation();
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (mobile.replace(/\D/g, "").length < 9) { toast.error("أدخل رقم جوال صحيحًا للمتابعة."); return; }
    setLoading(true);
    window.setTimeout(() => { setLoading(false); toast.success("تم الدخول إلى نموذج يسر التجريبي."); navigate("/start"); }, 550);
  };
  return <main className="login-page" dir="rtl">
    <section className="login-visual" style={{ backgroundImage: `linear-gradient(90deg, rgba(11,79,70,.26), rgba(11,79,70,.03)), ${loginVisual}` }}>
      <div className="login-visual-brand"><img src={logo} alt="شعار يسر" /><strong>يسر</strong></div>
      <div className="login-visual-copy"><p className="eyebrow">رحلة واحدة، من الأهلية إلى الاستقرار</p><h1>كل تفاصيل رحلتك السكنية في مكان واحد.</h1><p>تابع حالة طلبك، تعرّف على الخطوة التالية، واطمئن على وحدتك بعد الاستلام.</p></div>
      <div className="login-prototype"><ShieldCheck size={16} />نموذج أولي توضيحي — لا يمثل جهة حكومية رسمية</div>
    </section>
    <section className="login-form-panel">
      <div className="mobile-login-brand"><img src={logo} alt="شعار يسر" /><strong>يسر</strong></div>
      <div className="login-form-wrap">
        <div className="login-heading"><p className="eyebrow">أهلًا بك</p><h2>الدخول إلى رحلتك السكنية</h2><p>استخدم رقم جوالك للمتابعة إلى النموذج التجريبي.</p></div>
        <form onSubmit={submit} noValidate>
          <label htmlFor="mobile">رقم الجوال</label>
          <div className="input-with-icon"><Phone size={19} /><input id="mobile" inputMode="tel" autoComplete="tel" value={mobile} onChange={(event) => setMobile(event.target.value)} placeholder="05X XXX XXXX" aria-describedby="mobile-help" /></div>
          <p id="mobile-help" className="input-hint">لن يتم حفظ الرقم أو التحقق منه في هذا النموذج.</p>
          <button className="primary-btn login-submit" disabled={loading} type="submit">{loading ? "جارٍ التحقق..." : <>متابعة <ArrowLeft size={18} /></>}</button>
          <button className="demo-login-btn" type="button" onClick={() => { setMobile("0500002841"); toast.success("تم الدخول التجريبي باسم أحمد."); navigate("/start"); }}>دخول تجريبي باسم أحمد</button>
        </form>
        <div className="login-trust"><div><LockKeyhole size={17} /><span>خصوصية معلوماتك مهمة لنا</span></div><div><CheckCircle2 size={17} /><span>خطوات واضحة في كل مرحلة</span></div></div>
      </div>
    </section>
  </main>;
}
