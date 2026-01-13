import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { HardHat, Menu, LayoutDashboard, Weight, BookOpen, Settings2, LogOut, Landmark, Briefcase, Truck, ShoppingCart, Factory, ShieldCheck, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
  const userRole = useAuthStore(s => s.user?.role);
  const userFeatures = useAuthStore(s => s.user?.features);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const handleLogout = async () => {
    logout();
    queryClient.clear();
    toast.success("Logged out successfully");
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
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <HardHat className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tighter uppercase">SuiteWaste</span>
          </Link>
          <nav className="flex items-center gap-2">
            {filteredItems.map((item) => (
              <NavLink key={item.href} to={item.href} className={({ isActive }) => cn(
                "px-4 py-2 text-sm font-bold rounded-full transition-all",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5"
              )}>
                {item.label}
              </NavLink>
            ))}
            <div className="w-px h-6 bg-white/10 mx-2" />
            <ThemeToggle className="relative top-0 right-0" />
            <Button onClick={handleLogout} variant="ghost" size="icon"><LogOut className="h-5 w-5" /></Button>
          </nav>
        </div>
      </header>
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-background/90 backdrop-blur-2xl border-t border-white/5 z-50 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {accessibleNavItems.map(item => (
          <NavLink key={item.href} to={item.href} className={({ isActive }) => cn(
            "relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all",
            isActive ? "text-primary" : "text-muted-foreground"
          )}>
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
          </NavLink>
        ))}
        <Sheet open={isMobileMoreOpen} onOpenChange={setMobileMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center w-16 h-14 rounded-2xl text-muted-foreground">
              <Menu className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-black uppercase tracking-widest">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-background/95 backdrop-blur-2xl rounded-t-3xl p-8">
            <div className="grid grid-cols-3 gap-4 mb-8">
              {moreItems.map(item => (
                <NavLink key={item.href} to={item.href} onClick={() => setMobileMoreOpen(false)} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface-variant/50">
                  <item.icon className="h-6 w-6 text-primary" />
                  <span className="text-xs font-bold uppercase">{item.label}</span>
                </NavLink>
              ))}
              <NavLink to="/settings" onClick={() => setMobileMoreOpen(false)} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface-variant/50">
                <Settings2 className="h-6 w-6" />
                <span className="text-xs font-bold uppercase">Admin</span>
              </NavLink>
            </div>
            <Button onClick={handleLogout} variant="destructive" className="w-full h-14 rounded-2xl font-bold uppercase">
              <LogOut className="mr-2 h-5 w-5" /> Logout
            </Button>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}