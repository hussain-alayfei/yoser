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
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
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
    <Route path="/requirements" component={RequirementsPageV2} />
    <Route path="/notifications" component={NotificationsPage} />
    <Route path="/unit" component={UnitPage} />
    <Route path="/unit/twin" component={DigitalTwinStudioRoute} />
    <Route path="/unit/furnishing" component={FurnishingPage} />
    <Route path="/unit/maintenance" component={MaintenancePage} />
    <Route path="/unit/maintenance/new" component={NewMaintenancePage} />
    <Route path="/unit/maintenance/:id" component={MaintenanceDetailPage} />
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
