import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import LandingPage from "@/pages/landing";
import AuthPage from "@/pages/auth";
import ProfileSetup from "@/pages/profile-setup";
import Layout from "@/components/layout";
import HomePage from "@/pages/home";
import ChatPage from "@/pages/chat";
import EventsPage from "@/pages/events";
import ComplimentsPage from "@/pages/compliments";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!user ? (
        <>
          <Route path="/" component={LandingPage} />
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFound} />
        </>
      ) : !user.isProfileComplete ? (
        <>
          <Route path="/" component={ProfileSetup} />
          <Route component={ProfileSetup} />
        </>
      ) : (
        <>
          <Route path="/" component={HomePage} />
          <Route path="/home" component={HomePage} />
          <Route path="/chat/:matchId?" component={ChatPage} />
          <Route path="/events" component={EventsPage} />
          <Route path="/compliments" component={ComplimentsPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-subtle">
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
