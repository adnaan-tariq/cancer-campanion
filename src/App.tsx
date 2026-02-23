import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModelStatusProvider } from "@/contexts/ModelStatusContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ScanReader from "./pages/ScanReader";
import TrialFinder from "./pages/TrialFinder";
import TreatmentNavigator from "./pages/TreatmentNavigator";
import GDPR from "./pages/GDPR";
import HIPAA from "./pages/HIPAA";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ModelStatusProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/scan-reader" element={<ProtectedRoute><ScanReader /></ProtectedRoute>} />
              <Route path="/trial-finder" element={<ProtectedRoute><TrialFinder /></ProtectedRoute>} />
              <Route path="/treatment-navigator" element={<ProtectedRoute><TreatmentNavigator /></ProtectedRoute>} />
              <Route path="/gdpr" element={<GDPR />} />
              <Route path="/hipaa" element={<HIPAA />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </ModelStatusProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
