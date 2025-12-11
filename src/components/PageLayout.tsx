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
export const LeafLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("fill-current", className)} xmlns="http://www.w3.org/2000/svg">
    <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,11 17,8 17,8Z" />
  </svg>
);
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
    toast.success('Secure session terminated.');
    navigate('/login', { replace: true });
  };
  if (isLoading) {
    return (
      <div className="h-dvh w-full flex flex-col items-center justify-center bg-[#1a3620] overflow-hidden">
        <LeafLogo className="h-16 w-16 text-leaf animate-pulse-slow mb-8" />
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-leaf animate-load" />
        </div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-dvh w-full overflow-hidden bg-[#1a3620] relative text-foreground">
        {/* Global Background Layers */}
        <div className="fixed inset-0 industrial-grid z-0" />
        <div className="fixed inset-0 scanline-overlay z-0" />
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 relative min-w-0 bg-transparent overflow-hidden z-10">
          <header className="md:hidden h-16 flex items-center justify-between px-4 glass-panel border-b border-white/10 shrink-0 z-40">
            <SidebarTrigger className="h-10 w-10 rounded-xl hover:bg-white/10">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <div className="flex items-center gap-2">
              <LeafLogo className="h-6 w-6 text-leaf" />
              <span className="text-xs font-black uppercase tracking-widest text-white">SuiteWaste</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle className="h-10 w-10 relative z-50" />
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] bg-[#2E5A35] hover:bg-[#2E5A35]/80 border-none"
              >
                LOGOUT
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto scrollbar-hide relative">
            <div className={cn(
              "mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12",
              !fullBleed && "max-w-7xl",
              "pb-[max(120px,env(safe-area-inset-bottom))]"
            )}>
              {children}
            </div>
          </main>
          <GlobalNav />
        </SidebarInset>
      </div>
      <ThemeToggle className="fixed top-5 right-5 z-[99] hidden md:flex h-12 w-12 shadow-elevation-12" />
    </SidebarProvider>
  );
}