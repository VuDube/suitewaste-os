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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 404s
        if ((error as any)?.status === 404) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: import.meta.env.PROD, // Only refetch on focus in production
    },
  },
});
const ComingSoon = ({ pageName }: { pageName: string }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="py-8 md:py-10 lg:py-12 flex items-center justify-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">{pageName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">This page is under construction. Check back soon!</p>
        </CardContent>
      </Card>
    </div>
  </div>
);
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/quick-weight",
    element: <QuickWeightPOS />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/suppliers",
    element: <SupplierDirectory />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/ledger",
    element: <ComingSoon pageName="Inventory Ledger" />,
    errorElement: <RouteErrorBoundary />,
  }
]);
// PWA Service Worker Registration
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const { Workbox } = await import('workbox-window');
  const wb = new Workbox('/sw.js');
  wb.register();
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