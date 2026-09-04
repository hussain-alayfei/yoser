/** أسلوب خريطة الاستقرار: توزيع المسارات يعكس رحلة واحدة متصلة من الطلب إلى استقرار الوحدة. */
import "./sakan.css";
import "./refinement.css";
import "./upgrade.css";
import "./journey-experience.css";
import "./ai.css";
import "./motion.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LoginPage } from "./pages/Login";
import { OnboardingPage } from "./pages/Onboarding";
import { JourneyStartPage, HomePage, ProfilePage, ProgramsPage, ApplicationPage, RequirementsPage, NotificationsPage, UnitPage, MaintenancePage, MaintenanceDetailPage, NewMaintenancePage } from "./pages/BeneficiaryPages";
import { StaffPage } from "./pages/Staff";
import { AssociationPage, AssociationCasePage } from "./pages/Association";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return <Switch>
    <Route path="/" component={OnboardingPage} />
    <Route path="/onboarding" component={OnboardingPage} />
    <Route path="/login" component={LoginPage} />
    <Route path="/home" component={HomePage} />
    <Route path="/start" component={JourneyStartPage} />
    <Route path="/profile" component={ProfilePage} />
    <Route path="/programs" component={ProgramsPage} />
    <Route path="/application" component={ApplicationPage} />
    <Route path="/requirements" component={RequirementsPage} />
    <Route path="/notifications" component={NotificationsPage} />
    <Route path="/unit" component={UnitPage} />
    <Route path="/unit/maintenance" component={MaintenancePage} />
    <Route path="/unit/maintenance/new" component={NewMaintenancePage} />
    <Route path="/unit/maintenance/:id" component={MaintenanceDetailPage} />
    <Route path="/staff" component={StaffPage} />
    <Route path="/association" component={AssociationPage} />
    <Route path="/association/cases/:id" component={AssociationCasePage} />
    <Route component={HomePage} />
  </Switch>;
}

function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-center" dir="rtl" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }

export default App;
