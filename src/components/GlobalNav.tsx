import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { HardHat, Menu, LayoutDashboard, Weight, BookOpen, Settings2, LogOut, Landmark, Briefcase, Truck, ShoppingCart, Factory, ShieldCheck, MessageCircle, Zap, Box, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
const groups = [
  {
    name: "Operations",
    items: [
      { href: '/quick-weight', label: 'POS Terminal', icon: Weight, roles: ['operator', 'manager', 'admin'] },
      { href: '/operations', label: 'Yard Control', icon: Box, roles: ['manager', 'admin'] },
      { href: '/fleet', label: 'Logistics', icon: Truck, roles: ['manager', 'admin'] },
    ]
  },
  {
    name: "Governance",
    items: [
      { href: '/compliance', label: 'Legal Hub', icon: ShieldCheck, roles: ['manager', 'admin', 'auditor'] },
      { href: '/ledger', label: 'Audit Chain', icon: BookOpen, roles: ['manager', 'admin', 'auditor'] },
      { href: '/finance', label: 'Finance GL', icon: Landmark, roles: ['manager', 'admin', 'auditor'] },
    ]
  },
  {
    name: "Resources",
    items: [
      { href: '/staff', label: 'HR & Skills', icon: Briefcase, roles: ['manager', 'admin'] },
      { href: '/marketplace', label: 'Bids & Lots', icon: ShoppingCart, roles: ['buyer', 'admin'] },
      { href: '/wingman', label: 'AI Wingman', icon: MessageCircle, roles: ['operator', 'manager', 'admin'] },
    ]
  }
];
export function GlobalNav() {
  const userRole = useAuthStore(s => s.user?.role);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [latency, setLatency] = useState(14);
  useEffect(() => {
    const interval = setInterval(() => setLatency(10 + Math.floor(Math.random() * 10)), 5000);
    return () => clearInterval(interval);
  }, []);
  const handleLogout = () => {
    logout();
    queryClient.clear();
    toast.success("Industrial session terminated.");
    navigate('/login', { replace: true });
  };
  const triggerHaptic = () => {
    if (window.navigator.vibrate) window.navigator.vibrate(10);
  };
  return (
    <>
      <header className="hidden md:block sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group" onClick={triggerHaptic}>
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <HardHat className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">SuiteWaste OS</span>
          </Link>
          <nav className="flex items-center gap-1">
            <div className="flex items-center gap-2 mr-6 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ZA-CLOUD: {latency}ms
            </div>
            <NavLink to="/" onClick={triggerHaptic} className={({ isActive }) => cn(
              "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all",
              isActive ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-white/5"
            )}>Dashboard</NavLink>
            <NavLink to="/quick-weight" onClick={triggerHaptic} className={({ isActive }) => cn(
              "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all",
              isActive ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-white/5"
            )}>POS</NavLink>
            <div className="w-px h-8 bg-white/10 mx-4" />
            <ThemeToggle className="relative top-0 right-0 mr-2" />
            <Button onClick={handleLogout} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-5 w-5" />
            </Button>
          </nav>
        </div>
      </header>
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-background/90 backdrop-blur-2xl border-t border-white/5 z-50 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        <NavLink to="/" onClick={triggerHaptic} className={({ isActive }) => cn("flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all", isActive ? "text-primary scale-110" : "text-muted-foreground")}>
          <LayoutDashboard className="w-6 h-6 mb-1" />
          <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
        </NavLink>
        <NavLink to="/quick-weight" onClick={triggerHaptic} className={({ isActive }) => cn("flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all", isActive ? "text-primary scale-110" : "text-muted-foreground")}>
          <Weight className="w-6 h-6 mb-1" />
          <span className="text-[9px] font-black uppercase tracking-widest">POS</span>
        </NavLink>
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center w-16 h-14 rounded-2xl text-muted-foreground active:scale-90 transition-transform" onClick={triggerHaptic}>
              <Menu className="w-6 h-6 mb-1" />
              <span className="text-[9px] font-black uppercase tracking-widest">App Hub</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-background/95 backdrop-blur-3xl rounded-t-[3rem] p-8 border-t border-white/10 max-h-[85vh] overflow-y-auto scrollbar-hide">
            <SheetHeader className="mb-8">
              <SheetTitle className="text-3xl font-black uppercase tracking-tighter">Enterprise Master-Suite</SheetTitle>
              <SheetDescription className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest flex items-center gap-2"><Zap className="h-3 w-3 text-primary" /> Multi-App Ecosystem Active</SheetDescription>
            </SheetHeader>
            <div className="space-y-8 mb-10">
              {groups.map(group => (
                <div key={group.name} className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">{group.name}</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {group.items.filter(i => !userRole || i.roles.includes(userRole)).map(item => (
                      <NavLink key={item.href} to={item.href} onClick={triggerHaptic} className="flex flex-col items-center gap-2 p-5 rounded-3xl bg-surface-variant/40 hover:bg-primary/10 transition-colors group">
                        <item.icon className="h-6 w-6 text-foreground/80 group-hover:scale-110 group-hover:text-primary transition-all" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-center">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={handleLogout} variant="destructive" className="w-full h-16 rounded-[2rem] font-black uppercase tracking-widest text-base shadow-2xl active:scale-95 transition-transform mb-4">
              <LogOut className="mr-2 h-5 w-5" /> Terminate Session
            </Button>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}