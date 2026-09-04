/**
 * أسلوب خريطة الاستقرار: توجيه RTL واضح، مسار معلوماتي هادئ، وأخضر المسار كمرساة بصرية.
 */
import { Bell, Building2, CheckCircle2, Clock3, Compass, FileText, Home, Lock, LogOut, Menu, ShieldAlert, Sparkles, UserRound, UsersRound } from "lucide-react";
import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { getApplicationCreated, getJourneyStep } from "@/journeyExperience";
import { JourneyContinuation, JourneyNavigator } from "./JourneyNavigator";

const logo = "/manus-storage/sakan360-logo_9d61e873.png";

const navItems = [
  { href: "/home", label: "مساري", icon: Compass },
  { href: "/programs", label: "برامجي", icon: Sparkles },
  { href: "/application", label: "طلبي", icon: FileText },
  { href: "/unit", label: "مسكني", icon: Building2 },
  { href: "/notifications", label: "التحديثات", icon: Bell },
];

const associationNavItems = [{ href: "/association", label: "الرئيسية", icon: Home }, { href: "/association?view=cases", label: "الطلبات", icon: FileText }, { href: "/association?view=needs", label: "تحتاج تدخل", icon: ShieldAlert }, { href: "/association?view=delayed", label: "الحالات المتأخرة", icon: Clock3 }, { href: "/association?view=ready", label: "الجاهزة للمراجعة", icon: CheckCircle2 }, { href: "/association?view=alerts", label: "التنبيهات", icon: Bell }];

const fullNav = navItems;

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
  const [location, navigate] = useLocation();
  const hasApplication = getApplicationCreated();
  const currentJourneyStep = journeyStep ?? getJourneyStep(location, hasApplication);
  const beneficiaryNavItems = hasApplication ? fullNav : fullNav.slice(0, 3);
  return (
    <div className={`app-shell ${variant === "association" ? "association-shell" : ""}`} dir="rtl">
      <aside className={`sidebar ${open ? "is-open" : ""}`} aria-label="التنقل الرئيسي">
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
          <button className="menu-toggle" aria-label="فتح القائمة" onClick={() => setOpen(true)}><Menu size={22} /></button>
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
        <div className="page-body">{children}</div>
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
