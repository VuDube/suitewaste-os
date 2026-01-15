import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  HardHat, Weight, Box, Truck, ShieldCheck, 
  BookOpen, Landmark, Briefcase, ShoppingCart, 
  MessageCircle, Search, Activity, Zap 
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInput,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/useAuthStore";
import { useOfflineStore } from "@/stores/useOfflineStore";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
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
export function AppSidebar(): JSX.Element {
  const userRole = useAuthStore(s => s.user?.role);
  const pendingLedger = useOfflineStore(s => s.pendingLedgerEntries);
  const pendingTrans = useOfflineStore(s => s.pendingTransactions);
  const totalPending = (pendingLedger?.length || 0) + (pendingTrans?.length || 0);
  const [search, setSearch] = useState("");
  const filteredGroups = groups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      const matchesSearch = item.label.toLowerCase().includes(search.toLowerCase());
      const hasRole = !userRole || item.roles.includes(userRole);
      return matchesSearch && hasRole;
    })
  })).filter(group => group.items.length > 0);

  const navigate = useNavigate();
  const logoutAction = useAuthStore(s => s.logout);
  const queryClient = useQueryClient();
  const handleLogout = () => {
    logoutAction();
    queryClient.clear();
    toast.success('Session terminated.');
    navigate('/login', { replace: true });
  };
  return (
    <Sidebar className="hidden md:flex border-r border-white/5 bg-background/50 backdrop-blur-xl">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-glow">
            <HardHat className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-tighter leading-none">SuiteWaste</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Enterprise OS</span>
          </div>
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <SidebarInput 
            placeholder="Search Modules..." 
            className="pl-9 h-10 bg-surface-variant/50 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl text-xs font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 pb-4 scrollbar-hide">
        {filteredGroups.map(group => (
          <SidebarGroup key={group.name} className="mt-4">
            <SidebarGroupLabel className="px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
              {group.name}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map(item => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild className="p-0">
                    <NavLink
                      to={item.href}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all duration-200 group",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-elevation-4"
                          : "text-muted-foreground hover:bg-surface-variant/50 hover:text-foreground"
                      )}
                    >
                      {React.createElement(item.icon, { className: "h-4 w-4 shrink-0" })}
                      <span className="text-xs font-bold tracking-tight">{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-white/5 bg-surface-container/30">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Sync Health</span>
            </div>
            {totalPending > 0 && (
              <Badge variant="destructive" className="h-4 text-[8px] font-black px-1.5 animate-bounce">
                {totalPending}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 px-2">
            <Zap className="h-3 w-3 text-primary" />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Edge JHB-1 Online</span>
          </div>
        </div>
        <div className="pt-4 border-t border-white/10 mt-4">
          <Button 
            onClick={handleLogout} 
            variant="destructive" 
            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl hover:shadow-glow border-2 border-destructive/50 bg-destructive hover:bg-destructive/90 active:scale-95 transition-all justify-start px-4 gap-3"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            End Secure Session
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}