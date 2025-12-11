import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Weight, Menu, LogOut, Zap, Box, Truck, ShieldCheck, BookOpen, Landmark, Briefcase, ShoppingCart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
const groups = [
  {
    name: "Operations",
    color: "text-leaf",
    items: [
      { href: '/quick-weight', label: 'POS', icon: Weight, roles: ['operator', 'manager', 'admin'] },
      { href: '/operations', label: 'Yard', icon: Box, roles: ['manager', 'admin'] },
      { href: '/fleet', label: 'Fleet', icon: Truck, roles: ['manager', 'admin'] },
    ]
  },
  {
    name: "Governance",
    color: "text-leaf",
    items: [
      { href: '/compliance', label: 'Legal', icon: ShieldCheck, roles: ['manager', 'admin', 'auditor'] },
      { href: '/ledger', label: 'Audit', icon: BookOpen, roles: ['manager', 'admin', 'auditor'] },
      { href: '/finance', label: 'Finance', icon: Landmark, roles: ['manager', 'admin', 'auditor'] },
    ]
  }
];
export function GlobalNav() {
  const userRole = useAuthStore(s => s.user?.role);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#1a3620]/80 backdrop-blur-3xl border-t border-white/10 z-50 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
      <NavLink
        to="/"
        onClick={triggerHaptic}
        className={({ isActive }) => cn(
          "relative flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300",
          isActive ? "text-leaf scale-110" : "text-white/60"
        )}
      >
        <LayoutDashboard className="w-5 h-5 mb-1" />
        <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
        <span className={cn("absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-leaf shadow-glow transition-all duration-300", location.pathname === '/' ? 'opacity-100 scale-125' : 'opacity-0 scale-0')} />
      </NavLink>
      <NavLink
        to="/quick-weight"
        onClick={triggerHaptic}
        className={({ isActive }) => cn(
          "relative flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300",
          isActive ? "text-leaf scale-110" : "text-white/60"
        )}
      >
        <Weight className="w-5 h-5 mb-1" />
        <span className="text-[8px] font-black uppercase tracking-widest">POS</span>
        <span className={cn("absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-leaf shadow-glow transition-all duration-300", location.pathname === '/quick-weight' ? 'opacity-100 scale-125' : 'opacity-0 scale-0')} />
      </NavLink>
      <Sheet>
        <SheetTrigger asChild>
          <button className="flex flex-col items-center justify-center w-16 h-14 rounded-2xl text-white/60 active:scale-90 transition-transform" onClick={triggerHaptic}>
            <Menu className="w-5 h-5 mb-1" />
            <span className="text-[8px] font-black uppercase tracking-widest">Menu</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="bg-[#1a3620]/95 backdrop-blur-3xl rounded-t-[2.5rem] p-8 border-t border-white/10 max-h-[85vh] overflow-y-auto scrollbar-hide">
          <SheetHeader className="mb-8">
            <SheetTitle className="text-3xl font-black uppercase tracking-tighter text-white">Master-Suite</SheetTitle>
            <SheetDescription className="text-leaf font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
              <Zap className="h-3 w-3" /> System Control Active
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-10 mb-10">
            {groups.map(group => (
              <div key={group.name} className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-leaf ml-2">{group.name}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {group.items.filter(i => !userRole || i.roles.includes(userRole)).map(item => (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={triggerHaptic}
                      className="flex flex-col items-center gap-2 p-5 rounded-3xl bg-white/5 active:bg-leaf/20 active:scale-95 transition-all group border border-white/5"
                    >
                      <item.icon className="h-6 w-6 text-white/80 group-active:text-leaf" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-center text-white/60 group-active:text-white">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Button
            onClick={handleLogout}
            className="w-full h-16 rounded-3xl font-black uppercase tracking-widest text-sm bg-primary hover:bg-primary/90 text-white shadow-elevation-12 active:scale-95 transition-transform mb-4 border-none"
          >
            <LogOut className="mr-2 h-5 w-5 text-leaf" /> End Session
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}