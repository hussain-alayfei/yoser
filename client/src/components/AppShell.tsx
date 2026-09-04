/**
 * App shell for the beneficiary and association journeys.
 * Navigation stays stable across the experience; page state changes, the map does not.
 */
import { Bell, Building2, CheckCircle2, Clock3, FileText, Home, LogOut, Menu, ShieldAlert, UserRound, UsersRound } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { getApplicationCreated, getJourneyStep } from "@/journeyExperience";
import { JourneyContinuation, JourneyNavigator } from "./JourneyNavigator";

const logo = "/brand/yusr-logo.svg";

const navItems = [
  { href: "/home", label: "الرئيسية", icon: Home },
  { href: "/programs", label: "البرامج", icon: CheckCircle2 },
  { href: "/application", label: "الطلب", icon: FileText },
  { href: "/unit", label: "المسكن", icon: Building2 },
  { href: "/notifications", label: "التحديثات", icon: Bell },
];

const associationNavItems = [
  { href: "/association", label: "نظرة عامة", icon: Home },
  { href: "/association?view=cases", label: "كل الطلبات", icon: FileText },
  { href: "/association?view=needs", label: "تحتاج تدخل", icon: ShieldAlert },
  { href: "/association?view=delayed", label: "الحالات المتأخرة", icon: Clock3 },
  { href: "/association?view=ready", label: "الجاهزة للمراجعة", icon: CheckCircle2 },
];

const DRAWER_QUERY = "(max-width: 760px)";

function useIsDrawerLayout() {
  const [isDrawer, setIsDrawer] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(DRAWER_QUERY);
    const sync = () => setIsDrawer(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      mql.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);
  return isDrawer;
}

function NavLink({ href, label, icon: Icon, mobile = false }: { href: string; label: string; icon: typeof Home; mobile?: boolean }) {
  const [location] = useLocation();
  const [hrefPath, hrefSearch = ""] = href.split("?");
  const currentSearch = typeof window === "undefined" ? "" : window.location.search.replace(/^\?/, "");
  const hrefView = new URLSearchParams(hrefSearch).get("view");
  const currentView = new URLSearchParams(currentSearch).get("view");

  const active = hrefPath === "/home"
    ? location === "/home" || location === "/"
    : hrefPath === "/association"
      ? location === "/association" && (hrefView ? currentView === hrefView : !currentView)
      : location === hrefPath || location.startsWith(`${hrefPath}/`);

  return (
    <Link href={href} className={`nav-item ${active ? "active" : ""} ${mobile ? "mobile-nav-item" : ""}`} aria-current={active ? "page" : undefined}>
      <Icon aria-hidden="true" size={mobile ? 20 : 19} strokeWidth={active ? 2.4 : 2} />
      <span>{label}</span>
    </Link>
  );
}

export function AppShell({ children, eyebrow, title, subtitle, actions, variant = "beneficiary", journeyStep, hideJourneyContinuation = false }: { children: ReactNode; eyebrow?: string; title?: string; subtitle?: string; actions?: ReactNode; variant?: "beneficiary" | "association"; journeyStep?: number; hideJourneyContinuation?: boolean }) {
  const [open, setOpen] = useState(false);
  const isDrawer = useIsDrawerLayout();
  const drawerHidden = isDrawer && !open;
  const [location, navigate] = useLocation();

  useEffect(() => { setOpen(false); }, [location]);

  const hasApplication = getApplicationCreated();
  const currentJourneyStep = journeyStep ?? getJourneyStep(location, hasApplication);
  // Keep the information architecture stable even before an application exists.
  // Destination pages already explain when a feature is not available yet.
  const beneficiaryNavItems = navItems;

  return (
    <div className={`app-shell ${variant === "association" ? "association-shell" : ""}`} dir="rtl">
      <aside id="app-sidebar" className={`sidebar ${open ? "is-open" : ""}`} aria-label="التنقل الرئيسي" inert={drawerHidden} aria-hidden={drawerHidden || undefined}>
        <Link href={variant === "association" ? "/association" : "/home"} className="brand-lockup" aria-label="يسر · الصفحة الرئيسية">
          <img src={logo} alt="" className="brand-mark" />
          <div><strong>يسر</strong><small>رحلتك السكنية في مكان واحد</small></div>
        </Link>

        <nav className="side-nav">
          <p className="nav-caption">{variant === "association" ? "مساحة الجمعية" : "التنقل"}</p>
          {(variant === "association" ? associationNavItems : beneficiaryNavItems).map((item) => <NavLink key={`${item.href}-${item.label}`} {...item} />)}
        </nav>

        <div className="sidebar-bottom">
          <details className="role-switcher">
            <summary>تبديل مساحة العرض</summary>
            <div className="role-switcher-menu">
              <button className={`role-switch ${variant === "beneficiary" ? "active" : ""}`} onClick={() => navigate("/home")}><UserRound size={17} /><span>المستفيد</span></button>
              <button className={`role-switch ${variant === "association" ? "active" : ""}`} onClick={() => navigate("/association")}><UsersRound size={17} /><span>الجمعية</span></button>
              <button className="role-switch" onClick={() => navigate("/staff")}><Building2 size={17} /><span>موظف الجهة</span></button>
            </div>
          </details>
          <span className="prototype-tag">بيئة عرض تجريبية</span>
          <button className="logout-link" onClick={() => navigate("/login")}><LogOut size={17} /><span>تسجيل الخروج</span></button>
        </div>
      </aside>

      {open && <button className="sidebar-backdrop" aria-label="إغلاق القائمة" onClick={() => setOpen(false)} />}

      <main className="main-content">
        <header className="topbar">
          <button className="menu-toggle" aria-label={open ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={open} aria-controls="app-sidebar" onClick={() => setOpen(value => !value)}><Menu size={22} /></button>
          <Link href="/home" className="topbar-brand" aria-label="يسر · الصفحة الرئيسية">
            <img src={logo} alt="" className="topbar-brand-mark" />
            <strong>يسر</strong>
          </Link>
          <div className="topbar-spacer" />
          <button className="topbar-bell" aria-label="التحديثات" onClick={() => navigate("/notifications")}><Bell size={20} /><i /></button>
          <button className="profile-chip" onClick={() => navigate("/profile")} aria-label="فتح الملف الشخصي"><span>أحمد</span><UserRound size={19} /></button>
        </header>

        {(title || eyebrow) && (
          <section className="page-intro">
            <div>
              {eyebrow && <p className="eyebrow">{eyebrow}</p>}
              {title && <h1>{title}</h1>}
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="page-actions">{actions}</div>}
          </section>
        )}

        {variant === "association"
          ? <div className="journey-context association-context" aria-label="سياق الجمعية"><span>مساحة الجمعية</span><i /><strong>المتابعة الاستباقية</strong><small>الحالات المسندة للجمعية</small></div>
          : <JourneyNavigator currentStep={currentJourneyStep} />}

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
  return <div className="locked-unit-notice"><Building2 size={16} /><span>تتاح تفاصيل وحدتك بعد استلامها</span></div>;
}
