import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { Dashboard } from '@/pages/Dashboard';
import { QuickWeightPOS } from '@/pages/QuickWeightPOS';
import { SupplierDirectory } from '@/pages/SupplierDirectory';
import { InventoryLedger } from '@/pages/InventoryLedger';
import { Transactions } from '@/pages/Transactions';
import { HardwareIntegrations } from '@/pages/HardwareIntegrations';
import { Login } from '@/pages/Login';
import { Settings } from '@/pages/Settings';
import { Chat } from '@/pages/Chat';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        if ((error as any)?.status === 404 || (error as any)?.status === 401) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});
// Safeguard global exposure for offline store revalidation
if (typeof window !== 'undefined') {
  (window as any).queryClient = queryClient;
}
const router = createBrowserRouter([
  { path: "/", element: <Dashboard />, errorElement: <RouteErrorBoundary /> },
  { path: "/login", element: <Login />, errorElement: <RouteErrorBoundary /> },
  { path: "/quick-weight", element: <QuickWeightPOS />, errorElement: <RouteErrorBoundary /> },
  { path: "/suppliers", element: <SupplierDirectory />, errorElement: <RouteErrorBoundary /> },
  { path: "/ledger", element: <InventoryLedger />, errorElement: <RouteErrorBoundary /> },
  { path: "/transactions", element: <Transactions />, errorElement: <RouteErrorBoundary /> },
  { path: "/hardware", element: <HardwareIntegrations />, errorElement: <RouteErrorBoundary /> },
  { path: "/settings", element: <Settings />, errorElement: <RouteErrorBoundary /> },
  { path: "/chat", element: <Chat />, errorElement: <RouteErrorBoundary /> },
]);
// PWA Service Worker Registration with production checks
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        if (import.meta.env.DEV) console.log('SW registered:', registration.scope);
      },
      (err) => {
        if (import.meta.env.DEV) console.error('SW registration failed:', err);
      }
    );
  });
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)