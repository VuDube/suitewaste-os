import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { HardHat, Menu, LayoutDashboard, Weight, Users, BookOpen, Settings2, LogOut, FileText, Landmark, Briefcase, Truck, ShoppingCart, Factory, ShieldCheck, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
const navItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard, roles: ['operator', 'manager', 'admin', 'auditor', 'buyer', 'producer'] },
  { href: '/quick-weight', label: 'Weigh', icon: Weight, roles: ['operator', 'manager', 'admin'] },
  { href: '/ledger', label: 'Ledger', icon: BookOpen, roles: ['manager', 'admin', 'auditor'] },
  { href: '/transactions', label: 'Cash', icon: FileText, roles: ['manager', 'admin', 'auditor'] },
  { href: '/fleet', label: 'Fleet', icon: Truck, roles: ['manager', 'admin'], features: ['fleet-management'] },
  { href: '/marketplace', label: 'Market', icon: ShoppingCart, roles: ['buyer', 'admin'] },
  { href: '/producer-portal', label: 'ESG', icon: Factory, roles: ['producer', 'admin'] },
  { href: '/staff', label: 'Staff', icon: Briefcase, roles: ['manager', 'admin'] },
];
export function GlobalNav() {
  const [isMobileMoreOpen, setMobileMoreOpen] = useState(false);
  const { user } = useAuth();
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const handleLogout = async () => {
    logout();
    queryClient.clear();
    toast.success("Logged out successfully");
    navigate('/login', { replace: true });
  };
  const accessibleNavItems = navItems.filter(item =>
    user && item.roles.includes(item.roles.includes(user.role) ? user.role : 'never') &&
    (!item.features || item.features.every(f => user.features?.includes(f)))
  ).slice(0, 4);
  const moreItems = navItems.filter(item => 
    user && item.roles.includes(user.role) && !accessibleNavItems.includes(item)
  );
  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 touch-haptic">
            <HardHat className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tighter uppercase">SuiteWaste</span>
          </Link>
          <nav className="flex items-center gap-2">
            {navItems.filter(i => user && i.roles.includes(user.role)).map((item) => (
              <NavLink key={item.href} to={item.href} className={({ isActive }) => cn(
                "px-4 py-2 text-sm font-bold rounded-full transition-all touch-haptic",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5"
              )}>
                {item.label}
              </NavLink>
            ))}
            <div className="w-px h-6 bg-white/10 mx-2" />
            <ThemeToggle className="relative top-0 right-0" />
            <Button onClick={handleLogout} variant="ghost" size="icon" className="touch-haptic"><LogOut className="h-5 w-5" /></Button>
          </nav>
        </div>
      </header>
      {/* Mobile Bottom App Bar (Material3) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-background/90 backdrop-blur-2xl border-t border-white/5 z-50 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] shadow-elevation-12">
        {accessibleNavItems.map(item => (
          <NavLink key={item.href} to={item.href} className={({ isActive }) => cn(
            "relative flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all touch-haptic group",
            isActive ? "text-primary" : "text-muted-foreground"
          )}>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute inset-x-2 top-0 h-1 bg-primary/40 rounded-full animate-scale-in" />}
                <item.icon className={cn("w-6 h-6 mb-1 transition-transform group-active:scale-125", isActive && "fill-primary/20")} />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        <Sheet open={isMobileMoreOpen} onOpenChange={setMobileMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center w-16 h-14 rounded-2xl text-muted-foreground touch-haptic">
              <Menu className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-background/95 backdrop-blur-2xl rounded-t-3xl border-t-white/10 p-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <div className="grid grid-cols-3 gap-4 mb-8">
              {moreItems.map(item => (
                <NavLink key={item.href} to={item.href} onClick={() => setMobileMoreOpen(false)} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface-variant/50 touch-haptic">
                  <item.icon className="h-6 w-6 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-tighter">{item.label}</span>
                </NavLink>
              ))}
              <NavLink to="/settings" onClick={() => setMobileMoreOpen(false)} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface-variant/50 touch-haptic">
                <Settings2 className="h-6 w-6" />
                <span className="text-xs font-bold uppercase tracking-tighter">Admin</span>
              </NavLink>
            </div>
            <Button onClick={handleLogout} variant="destructive" className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest touch-haptic">
              <LogOut className="mr-2 h-5 w-5" /> Logout Session
            </Button>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}