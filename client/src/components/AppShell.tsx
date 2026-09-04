/**
 * أسلوب خريطة الاستقرار: توجيه RTL واضح، مسار معلوماتي هادئ، وأخضر المسار كمرساة بصرية.
 */
import { Bell, Building2, CheckCircle2, Clock3, Compass, FileText, Home, Lock, LogOut, Menu, ShieldAlert, Sparkles, UserRound, UsersRound } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { getApplicationCreated, getJourneyStep } from "@/journeyExperience";
import { JourneyContinuation, JourneyNavigator } from "./JourneyNavigator";

const logo = "/brand/yusr-logo.svg";

const navItems = [
  { href: "/home", label: "مساري", icon: Compass },
  { href: "/programs", label: "برامجي", icon: Sparkles },
  { href: "/application", label: "طلبي", icon: FileText },
  { href: "/unit", label: "مسكني", icon: Building2 },
  { href: "/notifications", label: "التحديثات", icon: Bell },
];

const associationNavItems = [{ href: "/association", label: "الرئيسية", icon: Home }, { href: "/association?view=cases", label: "الطلبات", icon: FileText }, { href: "/association?view=needs", label: "تحتاج تدخل", icon: ShieldAlert }, { href: "/association?view=delayed", label: "الحالات المتأخرة", icon: Clock3 }, { href: "/association?view=ready", label: "الجاهزة للمراجعة", icon: CheckCircle2 }, { href: "/association?view=alerts", label: "التنبيهات", icon: Bell }];

const fullNav = navItems;

/**
 * يطابق نقطة التوقف نفسها المستخدمة في CSS (‎760px‎) لا نقطة عامة،
 * لأن القائمة الجانبية تخرج خارج الشاشة عند هذا الحد بالضبط.
 */
const DRAWER_QUERY = "(max-width: 760px)";

function useIsDrawerLayout() {
  const [isDrawer, setIsDrawer] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(DRAWER_QUERY);
    const sync = () => setIsDrawer(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);
  return isDrawer;
}

function NavLink({ href, label, icon: Icon, mobile = false }: { href: string; label: string; icon: typeof Home; mobile?: boolean }) {
  const [location] = useLocation();
  const active = href === "/home" ? location === "/home" || location === "/" : location === href || location.startsWith(`${href}/`);
  return (
    <Link href={href} className={`nav-item ${active ? "active" : ""} ${mobile ? "mobile-nav-item" : ""}`}>
      <Icon aria-hidden="true" size={mobile ? 20 : 19} strokeWidth={active ? 2.5 : 2} />
      <span>{label}</span>
    </Link>
  );
}

export function AppShell({ children, eyebrow, title, subtitle, actions, variant = "beneficiary", journeyStep, hideJourneyContinuation = false }: { children: ReactNode; eyebrow?: string; title?: string; subtitle?: string; actions?: ReactNode; variant?: "beneficiary" | "association"; journeyStep?: number; hideJourneyContinuation?: boolean }) {
  const [open, setOpen] = useState(false);
  const isDrawer = useIsDrawerLayout();
  // القائمة المغلقة تبقى مرسومة خارج الشاشة، فلولا inert لظل قارئ الشاشة
  // ومفتاح Tab يصلان إلى روابط غير مرئية.
  const drawerHidden = isDrawer && !open;
  const [location, navigate] = useLocation();
  // بدون هذا تبقى القائمة مفتوحة فوق الصفحة الجديدة بعد الضغط على أي رابط.
  useEffect(() => { setOpen(false); }, [location]);
  const hasApplication = getApplicationCreated();
  const currentJourneyStep = journeyStep ?? getJourneyStep(location, hasApplication);
  const beneficiaryNavItems = hasApplication ? fullNav : fullNav.slice(0, 3);
  return (
    <div className={`app-shell ${variant === "association" ? "association-shell" : ""}`} dir="rtl">
      <aside id="app-sidebar" className={`sidebar ${open ? "is-open" : ""}`} aria-label="التنقل الرئيسي" inert={drawerHidden} aria-hidden={drawerHidden || undefined}>
        <div className="brand-lockup">
          <img src={logo} alt="شعار يسر" className="brand-mark" />
          <div><strong>يسر</strong><small>رحلتك السكنية في مكان واحد</small></div>
        </div>
        <div className="prototype-tag">نموذج أولي توضيحي</div>
        <nav className="side-nav">
          <p className="nav-caption">{variant === "association" ? "مساحة الجمعية" : "رحلتك"}</p>
          {(variant === "association" ? associationNavItems : beneficiaryNavItems).map((item) => <NavLink key={`${item.href}-${item.label}`} {...item} />)}
        </nav>
        <div className="sidebar-bottom"><p className="role-switch-label">تبديل الدور</p>
          <button className={`role-switch ${variant === "beneficiary" ? "active" : ""}`} onClick={() => navigate("/home")}><UserRound size={17} /><span>المستفيد</span></button>
          <button className={`role-switch ${variant === "association" ? "active" : ""}`} onClick={() => navigate("/association")}><UsersRound size={17} /><span>الجمعية</span></button>
          <button className="role-switch" onClick={() => navigate("/staff")}><Building2 size={17} /><span>موظف الجهة</span></button>
          <button className="logout-link" onClick={() => navigate("/login")}><LogOut size={17} /><span>تسجيل الخروج</span></button>
        </div>
      </aside>
      {open && <button className="sidebar-backdrop" aria-label="إغلاق القائمة" onClick={() => setOpen(false)} />}
      <main className="main-content">
        <header className="topbar">
          <button className="menu-toggle" aria-label={open ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={open} aria-controls="app-sidebar" onClick={() => setOpen(value => !value)}><Menu size={22} /></button>
          {/* العلامة تعيش داخل القائمة الجانبية، والقائمة تختفي على الجوال،
              فكانت الهوية غائبة تمامًا عن شاشات الهاتف. هذه نسخة مصغّرة تظهر هناك فقط. */}
          <Link href="/home" className="topbar-brand" aria-label="يسر · الصفحة الرئيسية">
            <img src={logo} alt="" className="topbar-brand-mark" />
            <strong>يسر</strong>
          </Link>
          <div className="topbar-spacer" />
          <button className="topbar-bell" aria-label="الإشعارات" onClick={() => navigate("/notifications")}><Bell size={20} /><i /></button>
          <button className="profile-chip" onClick={() => navigate("/profile")}><span>أحمد</span><UserRound size={19} /></button>
        </header>
        {(title || eyebrow) && <section className="page-intro">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h1>{title}</h1>}
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="page-actions">{actions}</div>}
        </section>}
        {variant === "association" ? <div className="journey-context association-context" aria-label="سياق الجمعية"><span>مساحة الجمعية</span><i /><strong>المتابعة الاستباقية</strong><small>الحالات المسندة للجمعية</small></div> : <JourneyNavigator currentStep={currentJourneyStep} />}
        {/* المفتاح على المسار يُعيد تركيب العنصر عند كل تنقّل، فتُشغَّل حركة الدخول من جديد. */}
        <div className="page-body" key={location}>{children}</div>
        {variant === "beneficiary" && !hideJourneyContinuation && <JourneyContinuation currentStep={currentJourneyStep} />}
      </main>
      <nav className="mobile-bottom-nav" aria-label="التنقل السفلي">
        {(variant === "association" ? associationNavItems.slice(0, 4) : beneficiaryNavItems).map((item) => <NavLink key={`${item.href}-${item.label}`} {...item} mobile />)}
      </nav>
    </div>
  );
}

export function LockedUnitNotice() {
  return <div className="locked-unit-notice"><Lock size={16} /><span>تتاح تفاصيل وحدتك بعد استلامها</span></div>;
}
