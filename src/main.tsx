import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { QuickWeightPOS } from '@/pages/QuickWeightPOS';
import { SupplierDirectory } from '@/pages/SupplierDirectory';
import { InventoryLedger } from '@/pages/InventoryLedger';
import { Transactions } from '@/pages/Transactions';
import { HardwareIntegrations } from '@/pages/HardwareIntegrations';
import { Login } from '@/pages/Login';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        if ((error as any)?.status === 404 || (error as any)?.status === 401) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: import.meta.env.PROD,
    },
  },
});
const router = createBrowserRouter([
  { path: "/login", element: <Login />, errorElement: <RouteErrorBoundary /> },
  { path: "/", element: <HomePage />, errorElement: <RouteErrorBoundary /> },
  { path: "/quick-weight", element: <QuickWeightPOS />, errorElement: <RouteErrorBoundary /> },
  { path: "/suppliers", element: <SupplierDirectory />, errorElement: <RouteErrorBoundary /> },
  { path: "/ledger", element: <InventoryLedger />, errorElement: <RouteErrorBoundary /> },
  { path: "/transactions", element: <Transactions />, errorElement: <RouteErrorBoundary /> },
  { path: "/hardware", element: <HardwareIntegrations />, errorElement: <RouteErrorBoundary /> },
]);
// PWA Service Worker Registration
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  import('workbox-window').then(({ Workbox }) => {
    const wb = new Workbox('/sw.js');
    wb.register();
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