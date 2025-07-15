import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import { AddStudent } from "./pages/AddStudent";
import { EditStudent } from "./pages/EditStudent";
import { Students } from "./pages/Students";
import { MarkEntry } from "./pages/MarkEntry";
import { Marksheet } from "./pages/Marksheet";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <Index />
              </Layout>
            }
          />
          <Route
            path="/add-student"
            element={
              <Layout>
                <AddStudent />
              </Layout>
            }
          />
          <Route
            path="/edit-student/:id"
            element={
              <Layout>
                <EditStudent />
              </Layout>
            }
          />
          <Route
            path="/students"
            element={
              <Layout>
                <Students />
              </Layout>
            }
          />
          <Route
            path="/mark-entry"
            element={
              <Layout>
                <MarkEntry />
              </Layout>
            }
          />
          <Route
            path="/marksheet"
            element={
              <Layout>
                <Marksheet />
              </Layout>
            }
          />
          <Route
            path="*"
            element={
              <Layout>
                <NotFound />
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
