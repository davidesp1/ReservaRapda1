import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CustomError from "@/pages/CustomError";
import CustomerDashboard from "@/pages/CustomerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import Reservations from "@/pages/Reservations";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense } from "react";

// Lazy loaded components
const PaymentDetails = lazy(() => import("@/pages/PaymentDetails"));
const PaymentSuccess = lazy(() => import("@/pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("@/pages/PaymentCancel"));

// Admin pages
import Dashboard from "@/pages/admin/Dashboard";
import Customers from "@/pages/admin/Customers";
import MenuManager from "@/pages/admin/MenuManager";
import TableManager from "@/pages/admin/TableManager";
import Finance from "@/pages/admin/Finance";
import ReportsManager from "@/pages/admin/ReportsManager";

// Loading spinner component
const LoadingSpinner = () => (
  <div className="h-screen flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>
);

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      
      {/* Customer routes */}
      <Route path="/dashboard" component={CustomerDashboard} />
      <Route path="/reservations" component={Reservations} />
      <Route path="/payment-details/:id">
        {() => (
          <Suspense fallback={<LoadingSpinner />}>
            <PaymentDetails />
          </Suspense>
        )}
      </Route>
      <Route path="/payment-success">
        {() => (
          <Suspense fallback={<LoadingSpinner />}>
            <PaymentSuccess />
          </Suspense>
        )}
      </Route>
      <Route path="/payment-cancel">
        {() => (
          <Suspense fallback={<LoadingSpinner />}>
            <PaymentCancel />
          </Suspense>
        )}
      </Route>
      
      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={Dashboard} />
      <Route path="/admin/customers" component={Customers} />
      <Route path="/admin/menu" component={MenuManager} />
      <Route path="/admin/tables" component={TableManager} />
      <Route path="/admin/finance" component={Finance} />
      <Route path="/admin/reports" component={ReportsManager} />
      
      {/* Error pages */}
      <Route path="/error/:code" component={CustomError} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
