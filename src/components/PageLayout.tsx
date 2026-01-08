import React from 'react';
import { Navigate } from 'react-router-dom';
import { GlobalNav } from '@/components/GlobalNav';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
type PageLayoutProps = {
  children: React.ReactNode;
  fullBleed?: boolean;
};
export function PageLayout({ children, fullBleed = false }: PageLayoutProps) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="h-dvh w-full flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="h-dvh flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top Safe Area Spacer for Header/Notch */}
      <div className="h-[env(safe-area-inset-top)] bg-background/95 sticky top-0 z-50" />
      <GlobalNav />
      <main className="flex-1 overflow-y-auto pb-[max(80px,env(safe-area-inset-bottom))] relative z-0 scrollbar-hide">
        <div className={cn(
          "mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10",
          !fullBleed && "max-w-7xl"
        )}>
          {children}
        </div>
      </main>
      {/* Bottom Safe Area Spacer */}
      <div className="h-[env(safe-area-inset-bottom)] bg-background/95 fixed bottom-0 w-full z-40 pointer-events-none" />
    </div>
  );
}