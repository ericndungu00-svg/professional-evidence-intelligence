import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminContactMessages from "./pages/AdminContactMessages";
import AdminProInterest from "./pages/AdminProInterest";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import CivilServiceBehaviourGuide from "./pages/guides/CivilServiceBehaviourGuide";
import CivilServiceBehavioursHub from "./pages/guides/CivilServiceBehavioursHub";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ResetPassword from "./pages/ResetPassword";
import SharedResult from "./pages/SharedResult";
import TermsOfService from "./pages/TermsOfService";
import VerifyEmail from "./pages/VerifyEmail";

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/reset-password" component={ResetPassword} /><Route path="/verify-email" component={VerifyEmail} /><Route path="/privacy" component={PrivacyPolicy} /><Route path="/terms" component={TermsOfService} /><Route path="/contact" component={Contact} /><Route path="/results/:slug" component={SharedResult} /><Route path="/guides/civil-service-success-profiles" component={CivilServiceBehavioursHub} /><Route path="/guides/civil-service-success-profiles/:slug" component={CivilServiceBehaviourGuide} /><Route path="/admin/pro-interest" component={AdminProInterest} /><Route path="/admin/contact-messages" component={AdminContactMessages} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
