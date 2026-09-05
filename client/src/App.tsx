/** أسلوب خريطة الاستقرار: صفحات المستفيد مرتبطة كرحلة واحدة واضحة ومتجاوبة. */
import "./sakan.css";
import "./refinement.css";
import "./upgrade.css";
import "./journey-experience.css";
import "./ai.css";
import "./motion.css";
// design.css يُستورد في main.tsx بعد index.css لا هنا.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, type ReactNode, Suspense } from "react";
import { Link, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { AppShell } from "./components/AppShell";
import { ThemeProvider } from "./contexts/ThemeContext";
import { getApplicationCreated, getHandoverComplete, getUnitReady } from "./journeyExperience";
import { LoginPage } from "./pages/Login";
import { OnboardingPage } from "./pages/Onboarding";
import { JourneyStartPage, HomePage, ProfilePage, ProgramsPage, ApplicationPage, NotificationsPage, UnitPage, MaintenancePage, MaintenanceDetailPage, NewMaintenancePage } from "./pages/BeneficiaryPages";
import { RequirementsPageV2 } from "./pages/RequirementsPageV2";
import { FurnishingPage } from "./pages/FurnishingPage";
import { StaffPage } from "./pages/Staff";
import { AssociationCasePage } from "./pages/Association";
import { AssociationWorkspacePage } from "./pages/AssociationWorkspace";

const DigitalTwinStudioPage = lazy(() => import("./pages/DigitalTwinStudio").then((module) => ({ default: module.DigitalTwinStudioPage })));

function DigitalTwinStudioRoute() {
  return <Suspense fallback={<main className="twin-studio-route-loading" dir="rtl"><span /><div><strong>جاري تجهيز التوأم الرقمي الهندسي</strong><small>تحميل المحرك ثلاثي الأبعاد ومسارات الأنظمة…</small></div></main>}><DigitalTwinStudioPage /></Suspense>;
}

function JourneyGate({ allowed, eyebrow, title, description, href, action, children }: {
  allowed: boolean;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
  children: ReactNode;
}) {
  if (allowed) return <>{children}</>;
  return (
    <AppShell journeyStep={3} hideJourneyContinuation eyebrow={eyebrow} title={title} subtitle="نحافظ على ترتيب الرحلة حتى لا تظهر لك خدمة قبل أن تصبح متاحة فعليًا.">
      <section className="journey-empty-state journey-gate-state">
        <div>
          <p className="eyebrow">هذه الخطوة غير متاحة بعد</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <Link className="primary-btn" href={href}>{action}</Link>
      </section>
    </AppShell>
  );
}

function GuardedRequirementsPage() {
  return <JourneyGate allowed={getApplicationCreated()} eyebrow="تسلسل الرحلة" title="قدّم طلبك أولًا" description="المتطلبات المرتبطة بالمراجعة لا تظهر قبل إكمال البيانات واختيار البرنامج وتقديم الطلب." href="/application" action="العودة إلى الطلب"><RequirementsPageV2 /></JourneyGate>;
}

function GuardedUnitPage() {
  return <JourneyGate allowed={getUnitReady()} eyebrow="تسلسل الرحلة" title="الوحدة لم تُخصّص بعد" description="يفتح قسم المسكن والتوأم الرقمي عندما تؤكد الجهة تخصيص الوحدة وانتقال الطلب إلى مرحلة البناء." href="/application" action="متابعة حالة الطلب"><UnitPage /></JourneyGate>;
}

function GuardedDigitalTwinStudioRoute() {
  return <JourneyGate allowed={getUnitReady()} eyebrow="تسلسل الرحلة" title="التوأم الرقمي غير متاح بعد" description="لا نعرض نموذج وحدة على أنه وحدتك قبل اكتمال التخصيص. سيظهر التوأم الرقمي تلقائيًا عند جاهزية المسكن للمتابعة." href="/application" action="متابعة حالة الطلب"><DigitalTwinStudioRoute /></JourneyGate>;
}

function GuardedFurnishingPage() {
  return <JourneyGate allowed={getHandoverComplete()} eyebrow="تسلسل الرحلة" title="التأثيث يبدأ بعد الاستلام" description="لا يمكن الانتقال إلى التأثيث قبل اكتمال الاستلام وتأكيد جاهزية الوحدة." href="/application" action="متابعة الرحلة"><FurnishingPage /></JourneyGate>;
}

function GuardedMaintenancePage() {
  return <JourneyGate allowed={getHandoverComplete()} eyebrow="تسلسل الرحلة" title="العناية بالمسكن تبدأ بعد الاستلام" description="خدمات الصيانة والبلاغات تفتح بعد استلام الوحدة، حتى لا تظهر لك إجراءات غير قابلة للتنفيذ." href="/application" action="متابعة الرحلة"><MaintenancePage /></JourneyGate>;
}

function GuardedMaintenanceDetailPage() {
  return <JourneyGate allowed={getHandoverComplete()} eyebrow="تسلسل الرحلة" title="العناية بالمسكن تبدأ بعد الاستلام" description="تفاصيل البلاغات غير متاحة قبل اكتمال استلام الوحدة." href="/application" action="متابعة الرحلة"><MaintenanceDetailPage /></JourneyGate>;
}

function GuardedNewMaintenancePage() {
  return <JourneyGate allowed={getHandoverComplete()} eyebrow="تسلسل الرحلة" title="العناية بالمسكن تبدأ بعد الاستلام" description="إنشاء بلاغ صيانة يتطلب استلام الوحدة أولًا." href="/application" action="متابعة الرحلة"><NewMaintenancePage /></JourneyGate>;
}

function Router() {
  return <Switch>
    <Route path="/" component={OnboardingPage} />
    <Route path="/onboarding" component={OnboardingPage} />
    <Route path="/login" component={LoginPage} />
    <Route path="/home" component={HomePage} />
    <Route path="/start" component={JourneyStartPage} />
    <Route path="/profile" component={ProfilePage} />
    <Route path="/programs" component={ProgramsPage} />
    <Route path="/application" component={ApplicationPage} />
    <Route path="/requirements" component={GuardedRequirementsPage} />
    <Route path="/notifications" component={NotificationsPage} />
    <Route path="/unit" component={GuardedUnitPage} />
    <Route path="/unit/twin" component={GuardedDigitalTwinStudioRoute} />
    <Route path="/unit/furnishing" component={GuardedFurnishingPage} />
    <Route path="/unit/maintenance" component={GuardedMaintenancePage} />
    <Route path="/unit/maintenance/new" component={GuardedNewMaintenancePage} />
    <Route path="/unit/maintenance/:id" component={GuardedMaintenanceDetailPage} />
    <Route path="/staff" component={StaffPage} />

    <Route path="/association/cases/:id" component={AssociationCasePage} />
    <Route path="/association/cases" component={AssociationWorkspacePage} />
    <Route path="/association/needs" component={AssociationWorkspacePage} />
    <Route path="/association/delayed" component={AssociationWorkspacePage} />
    <Route path="/association/ready" component={AssociationWorkspacePage} />
    <Route path="/association" component={AssociationWorkspacePage} />

    <Route component={HomePage} />
  </Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-center" dir="rtl" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
