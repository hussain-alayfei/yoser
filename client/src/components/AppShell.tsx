/**
 * App shell for the beneficiary and association journeys.
 * The shell is intentionally stable across the whole internal experience:
 * header, sidebar and content lane do not change just because the user moved
 * from onboarding data to application tracking.
 */
import { Armchair, ArrowRight, Bell, Building2, CheckCircle2, ClipboardList, Clock3, Compass, Home, LockKeyhole, LogOut, Menu, ShieldAlert, UserRound, UsersRound } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { getApplicationCreated, getHandoverComplete, getJourneyStep, getUnitReady } from "@/journeyExperience";
import { JourneyContinuation, JourneyNavigator } from "./JourneyNavigator";

const logo = "/brand/yusr-logo.svg";

const navItems = [
  { href: "/home", label: "الرئيسية", icon: Home },
  { href: "/application", label: "رحلتي", icon: Compass },
  { href: "/requirements", label: "المتطلبات", icon: ClipboardList },
  { href: "/unit", label: "المسكن", icon: Building2 },
  { href: "/unit/furnishing", label: "التأثيث", icon: Armchair },
  { href: "/notifications", label: "التحديثات", icon: Bell },
];

const associationNavItems = [
  { href: "/association", label: "نظرة عامة", icon: Home },
  { href: "/association/cases", label: "كل الطلبات", icon: ClipboardList },
  { href: "/association/needs", label: "تحتاج تدخل", icon: ShieldAlert },
  { href: "/association/delayed", label: "الحالات المتأخرة", icon: Clock3 },
  { href: "/association/ready", label: "الجاهزة للمراجعة", icon: CheckCircle2 },
];

const JOURNEY_ROUTES = new Set(["/start", "/programs", "/application", "/unit", "/unit/maintenance"]);
const GUIDED_ROUTES = new Set(["/start", "/programs"]);
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

type NavLinkProps = {
  href: string;
  targetHref?: string;
  label: string;
  icon: typeof Home;
  mobile?: boolean;
  locked?: boolean;
  lockReason?: string;
};

function NavLink({ href, targetHref, label, icon: Icon, mobile = false, locked = false, lockReason }: NavLinkProps) {
  const [location] = useLocation();

  const active = href === "/home"
    ? location === "/home" || location === "/"
    : href === "/application"
      ? location === "/start" || location === "/programs" || location === "/application"
      : href === "/unit"
        ? location === "/unit" || location.startsWith("/unit/twin") || location.startsWith("/unit/maintenance")
        : href === "/association"
          ? location === "/association"
          : location === href || location.startsWith(`${href}/`);

  const className = `nav-item ${active ? "active" : ""} ${mobile ? "mobile-nav-item" : ""} ${locked ? "nav-item-locked" : ""}`;
  const content = (
    <>
      <Icon aria-hidden="true" size={mobile ? 20 : 19} strokeWidth={active ? 2.4 : 2} />
      <span>{label}</span>
      {locked && <LockKeyhole className="nav-lock-icon" aria-hidden="true" size={mobile ? 13 : 14} />}
    </>
  );

  if (locked) {
    return <span className={className} aria-disabled="true" title={lockReason}>{content}</span>;
  }

  return (
    <Link href={targetHref ?? href} className={className} aria-current={active ? "page" : undefined}>
      {content}
    </Link>
  );
}

export function AppShell({ children, eyebrow, title, subtitle, actions, variant = "beneficiary", journeyStep, hideJourneyContinuation = false }: { children: ReactNode; eyebrow?: string; title?: string; subtitle?: string; actions?: ReactNode; variant?: "beneficiary" | "association"; journeyStep?: number; hideJourneyContinuation?: boolean }) {
  const [open, setOpen] = useState(false);
  const isDrawer = useIsDrawerLayout();
  const [location, navigate] = useLocation();

  useEffect(() => { setOpen(false); }, [location]);

  const hasApplication = getApplicationCreated();
  const unitReady = getUnitReady();
  const handoverComplete = getHandoverComplete();
  const hasProfile = (() => { try { return Boolean(sessionStorage.getItem("sakan-profile")); } catch { return false; } })();
  const selectedProgram = (() => { try { return sessionStorage.getItem("yusr-selected-program") ?? ""; } catch { return ""; } })();
  const currentJourneyStep = journeyStep ?? getJourneyStep(location, hasApplication);
  const showJourney = variant === "beneficiary" && JOURNEY_ROUTES.has(location);
  const guidedFlow = variant === "beneficiary" && (GUIDED_ROUTES.has(location) || (location === "/application" && !hasApplication));

  // Internal pages always share the same navigation frame. On phones the same
  // sidebar becomes a drawer instead of disappearing from the product model.
  const showSidebar = true;
  const drawerHidden = isDrawer && !open;
  const showMobileBottomNav = !showJourney;
  const routeKey = location === "/" ? "root" : location.replace(/^\//, "").replace(/[^a-zA-Z0-9]+/g, "-") || "root";

  const journeyTargetHref = !hasProfile ? "/start" : !selectedProgram ? "/programs" : "/application";
  const beneficiaryItems: NavLinkProps[] = navItems.map((item) => {
    if (item.href === "/application") return { ...item, targetHref: journeyTargetHref };
    if (item.href === "/requirements") return {
      ...item,
      locked: !hasApplication,
      lockReason: "تتاح المتطلبات بعد إكمال البيانات واختيار البرنامج وتقديم الطلب.",
    };
    if (item.href === "/unit") return {
      ...item,
      locked: !unitReady,
      lockReason: "يفتح المسكن عند اكتمال مراجعة الطلب وتخصيص الوحدة من الجهة المختصة.",
    };
    if (item.href === "/unit/furnishing") return {
      ...item,
      locked: !handoverComplete,
      lockReason: "يفتح التأثيث بعد اكتمال الاستلام وتأكيد جاهزية الوحدة.",
    };
    return item;
  });
  const desktopItems = variant === "association" ? associationNavItems : beneficiaryItems;
  const mobileItems = variant === "association"
    ? associationNavItems.slice(0, 4)
    : beneficiaryItems.filter((item) => item.href !== "/requirements");

  const guidedBack = location === "/start"
    ? { href: "/home", label: "الرئيسية" }
    : location === "/programs"
      ? { href: "/start", label: "بياناتك" }
      : location === "/application" && !hasApplication
        ? { href: "/programs", label: "البرنامج" }
        : null;

  return (
    <div className={`app-shell route-${routeKey} ${guidedFlow ? "journey-guided" : ""} ${variant === "association" ? "association-shell" : ""}`} dir="rtl">
      {showSidebar && (
        <aside id="app-sidebar" className={`sidebar ${open ? "is-open" : ""}`} aria-label="التنقل الرئيسي" inert={drawerHidden} aria-hidden={drawerHidden || undefined}>
          <Link href={variant === "association" ? "/association" : "/home"} className="brand-lockup" aria-label="يسر · الصفحة الرئيسية">
            <img src={logo} alt="" className="brand-mark" />
            <div><strong>يسر</strong><small>من البداية إلى استقرار المسكن</small></div>
          </Link>

          <nav className="side-nav">
            <p className="nav-caption">{variant === "association" ? "مساحة الجمعية" : "الأقسام الرئيسية"}</p>
            {desktopItems.map((item) => <NavLink key={`${item.href}-${item.label}`} {...item} />)}
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
      )}

      {showSidebar && open && <button className="sidebar-backdrop" aria-label="إغلاق القائمة" onClick={() => setOpen(false)} />}

      <main className="main-content">
        <header className="topbar">
          {showSidebar && <button className="menu-toggle" aria-label={open ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={open} aria-controls="app-sidebar" onClick={() => setOpen(value => !value)}><Menu size={22} /></button>}
          <Link href="/home" className="topbar-brand" aria-label="يسر · الصفحة الرئيسية">
            <img src={logo} alt="" className="topbar-brand-mark" />
            <strong>يسر</strong>
          </Link>
          <div className="topbar-spacer" />
          <button className="topbar-bell" aria-label="التحديثات" onClick={() => navigate("/notifications")}><Bell size={20} /><i /></button>
          <button className="profile-chip" onClick={() => navigate("/profile")} aria-label="فتح الملف الشخصي"><span>أحمد</span><UserRound size={19} /></button>
        </header>

        {showJourney && <JourneyNavigator currentStep={currentJourneyStep} />}

        {guidedBack && (
          <div className="guided-back-row">
            <Link className="guided-back-link" href={guidedBack.href}><ArrowRight size={16} />رجوع إلى {guidedBack.label}</Link>
          </div>
        )}

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

        {variant === "association" && <div className="journey-context association-context" aria-label="سياق الجمعية"><span>مساحة الجمعية</span><i /><strong>المتابعة الاستباقية</strong><small>الحالات المسندة للجمعية</small></div>}

        <div className="page-body" key={location}>{children}</div>
        {showJourney && !guidedFlow && !hideJourneyContinuation && <JourneyContinuation currentStep={currentJourneyStep} />}
      </main>

      {showMobileBottomNav && (
        <nav className="mobile-bottom-nav" aria-label="التنقل السفلي">
          {mobileItems.map((item) => <NavLink key={`${item.href}-${item.label}`} {...item} mobile />)}
        </nav>
      )}
    </div>
  );
}

export function LockedUnitNotice() {
  return <div className="locked-unit-notice"><Building2 size={16} /><span>تتاح تفاصيل وحدتك بعد استلامها</span></div>;
}
