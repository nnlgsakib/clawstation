import { HashRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import Dashboard from "@/pages/dashboard";
import { Docker } from "@/pages/docker";
import { Install } from "@/pages/install";
import { Configure } from "@/pages/configure";
import { Monitor } from "@/pages/monitor";
import { Settings } from "@/pages/settings";

const queryClient = new QueryClient();

export function AppRouter() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/docker" element={<Docker />} />
            <Route path="/install" element={<Install />} />
            <Route path="/configure" element={<Configure />} />
            <Route path="/monitor" element={<Monitor />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppShell>
      </HashRouter>
      <Toaster richColors position="bottom-right" />
    </QueryClientProvider>
  );
}
