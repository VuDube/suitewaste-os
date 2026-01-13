import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  HardHat, 
  Menu, 
  LayoutDashboard, 
  Weight, 
  BookOpen, 
  Settings2, 
  LogOut, 
  Landmark, 
  Briefcase, 
  Truck, 
  ShoppingCart, 
  Factory, 
  ShieldCheck, 
  MessageCircle, 
  Zap,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
const navItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard, roles: ['operator', 'manager', 'admin', 'auditor', 'buyer', 'producer'] },
  { href: '/quick-weight', label: 'POS', icon: Weight, roles: ['operator', 'manager', 'admin'] },
  { href: '/compliance', label: 'Legal', icon: ShieldCheck, roles: ['manager', 'admin', 'auditor'] },
  { href: '/ledger', label: 'Audit', icon: BookOpen, roles: ['manager', 'admin', 'auditor'] },
  { href: '/finance', label: 'Finance', icon: Landmark, roles: ['manager', 'admin', 'auditor'] },
  { href: '/fleet', label: 'Fleet', icon: Truck, roles: ['manager', 'admin'], feature: 'fleet' },
  { href: '/marketplace', label: 'Bids', icon: ShoppingCart, roles: ['buyer', 'admin'] },
  { href: '/producer-portal', label: 'ESG Hub', icon: Factory, roles: ['producer', 'admin'] },
  { href: '/staff', label: 'Staff', icon: Briefcase, roles: ['manager', 'admin'] },
  { href: '/wingman', label: 'Wingman', icon: MessageCircle, roles: ['operator', 'manager', 'admin', 'driver'] },
];
export function GlobalNav() {
  const [isMobileMoreOpen, setMobileMoreOpen] = useState(false);
  // Zustand Zero-Tolerance Selectors
  const userRole = useAuthStore(s => s.user?.role);
  const userFeatures = useAuthStore(s => s.user?.features);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const handleLogout = async () => {
    logout();
    queryClient.clear();
    toast.success("Industrial session terminated.");
    navigate('/login', { replace: true });
  };
  const filteredItems = navItems.filter(item => {
    if (!userRole) return false;
    const roleMatch = item.roles.includes(userRole);
    const featureMatch = !item.feature || userFeatures?.includes(item.feature);
    return roleMatch && featureMatch;
  });
  const accessibleNavItems = filteredItems.slice(0, 5);
  const moreItems = filteredItems.slice(5);
  return (
    <>
      <header className="hidden md:block sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <HardHat className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">SuiteWaste OS</span>
          </Link>
          <nav className="flex items-center gap-1">
            {filteredItems.slice(0, 7).map((item) => (
              <NavLink key={item.href} to={item.href} className={({ isActive }) => cn(
                "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all",
                isActive ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-white/5"
              )}>
                {item.label}
              </NavLink>
            ))}
            <div className="w-px h-8 bg-white/10 mx-4" />
            <ThemeToggle className="relative top-0 right-0 mr-2" />
            <Button onClick={handleLogout} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-5 w-5" />
            </Button>
          </nav>
        </div>
      </header>
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-background/90 backdrop-blur-2xl border-t border-white/5 z-50 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {accessibleNavItems.map(item => (
          <NavLink key={item.href} to={item.href} className={({ isActive }) => cn(
            "relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all touch-haptic",
            isActive ? "text-primary scale-110" : "text-muted-foreground"
          )}>
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
          </NavLink>
        ))}
        <Sheet open={isMobileMoreOpen} onOpenChange={setMobileMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center w-16 h-14 rounded-2xl text-muted-foreground active:scale-90 transition-transform">
              <Menu className="w-6 h-6 mb-1" />
              <span className="text-[9px] font-black uppercase tracking-widest">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-background/95 backdrop-blur-3xl rounded-t-[3rem] p-8 border-t border-white/10" aria-labelledby="more-nav-title" aria-describedby="more-nav-desc">
            <SheetHeader className="mb-6">
              <SheetTitle id="more-nav-title" className="text-3xl font-black uppercase tracking-tighter">Enterprise OS</SheetTitle>
              <SheetDescription id="more-nav-desc" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">SuiteWaste Industrial Hub</SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3 mb-10">
              {moreItems.map(item => (
                <NavLink key={item.href} to={item.href} onClick={() => setMobileMoreOpen(false)} className="flex flex-col items-center gap-2 p-5 rounded-3xl bg-surface-variant/50 hover:bg-primary/10 transition-colors group">
                  <item.icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                </NavLink>
              ))}
              <NavLink to="/settings" onClick={() => setMobileMoreOpen(false)} className="flex flex-col items-center gap-2 p-5 rounded-3xl bg-surface-variant/50 hover:bg-accent/10 transition-colors group">
                <Settings2 className="h-6 w-6 text-muted-foreground group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest">Admin</span>
              </NavLink>
            </div>
            <Button onClick={handleLogout} variant="destructive" className="w-full h-16 rounded-[2rem] font-black uppercase tracking-widest text-base shadow-2xl active:scale-95 transition-transform">
              <LogOut className="mr-2 h-5 w-5" /> Logout Terminal
            </Button>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}