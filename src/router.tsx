import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import Dashboard from "@/pages/dashboard";
import { Docker } from "@/pages/docker";
import { Install } from "@/pages/install";
import { Configure } from "@/pages/configure";
import { Monitor } from "@/pages/monitor";
import { Settings } from "@/pages/settings";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/docker" element={<Docker />} />
          <Route path="/install" element={<Install />} />
          <Route path="/configure" element={<Configure />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export function AppRouter() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppShell>
          <AnimatedRoutes />
        </AppShell>
      </HashRouter>
      <Toaster richColors position="bottom-right" />
    </QueryClientProvider>
  );
}
