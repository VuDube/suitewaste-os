import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { GlobalNav } from '@/components/GlobalNav';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Menu, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
type PageLayoutProps = {
  children: React.ReactNode;
  fullBleed?: boolean;
};
export function PageLayout({ children, fullBleed = false }: PageLayoutProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const logoutAction = useAuthStore(s => s.logout);
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logoutAction();
    queryClient.clear();
    toast.success('Industrial session terminated.');
    navigate('/login', { replace: true });
  };
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
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 relative min-w-0 bg-background overflow-hidden">
          {/* Header Safe Area Spacer */}
          <div className="h-[env(safe-area-inset-top)] bg-background/95 shrink-0 z-50 md:hidden" />
          {/* Mobile Top Header (Minimal) */}
          <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-white/5 bg-background/80 backdrop-blur-xl shrink-0 z-40">
            <SidebarTrigger className="h-10 w-10 rounded-xl hover:bg-surface-variant/50">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <div className="flex-1 flex justify-center">
              <span className="text-xs font-black uppercase tracking-widest text-center">SuiteWaste OS</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle className="h-10 w-10 hover:scale-105 transition-transform z-50" />
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleLogout} 
                className="h-10 px-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-2xl border-2 border-destructive hover:border-destructive/80 bg-destructive/95 hover:bg-destructive active:scale-95 transition-all ml-auto"
              >
                <LogOut className="h-4 w-4 mr-1" />
                LOGOUT
              </Button>
            </div>
          </header>
          {/* Main Scrollable Content */}
          <main className="flex-1 overflow-y-auto scrollbar-hide relative z-0">
            <div className={cn(
              "mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10",
              !fullBleed && "max-w-7xl",
              "pb-[max(100px,env(safe-area-inset-bottom))]" // Ensure bottom nav clearance
            )}>
              {children}
            </div>
          </main>
          {/* Bottom Bar for Mobile */}
          <GlobalNav />
          {/* Footer Safe Area Spacer */}
          <div className="h-[env(safe-area-inset-bottom)] bg-background/95 shrink-0 z-40 md:hidden" />
        </SidebarInset>
      </div>
      {/* Fixed Desktop ThemeToggle */}
      <ThemeToggle className="fixed top-5 right-5 z-[99] hidden md:flex h-12 w-12 shadow-xl pointer-events-auto" />
    </SidebarProvider>
  );
}