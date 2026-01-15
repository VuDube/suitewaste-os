import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Weight, Box, Truck, ShieldCheck,
  BookOpen, Landmark, Briefcase, ShoppingCart,
  MessageCircle, Search, Activity, Zap, LogOut
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
import { LeafLogo } from "@/components/PageLayout";
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
  const navigate = useNavigate();
  const logoutAction = useAuthStore(s => s.logout);
  const queryClient = useQueryClient();
  const handleLogout = () => {
    logoutAction();
    queryClient.clear();
    toast.success('Secure session terminated.');
    navigate('/login', { replace: true });
  };
  const filteredGroups = groups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      const matchesSearch = item.label.toLowerCase().includes(search.toLowerCase());
      const hasRole = !userRole || item.roles.includes(userRole);
      return matchesSearch && hasRole;
    })
  })).filter(group => group.items.length > 0);
  return (
    <Sidebar className="hidden md:flex border-r border-white/5 bg-[#1a3620]/90 backdrop-blur-3xl">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-4 px-2 mb-6">
          <div className="h-12 w-12 bg-primary leaf-glow rounded-2xl flex items-center justify-center">
            <LeafLogo className="h-7 w-7 text-leaf" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black uppercase tracking-tighter leading-none text-white">SuiteWaste</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-leaf">Enterprise OS</span>
          </div>
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 transition-colors group-focus-within:text-leaf" />
          <SidebarInput
            placeholder="System Search..."
            className="pl-10 h-12 bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-leaf rounded-2xl text-xs font-bold text-white placeholder:text-white/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-4 pb-4 scrollbar-hide">
        {filteredGroups.map(group => (
          <SidebarGroup key={group.name} className="mt-4">
            <SidebarGroupLabel className="px-3 text-[10px] font-black uppercase tracking-widest text-leaf mb-2">
              {group.name}
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1">
              {group.items.map(item => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild className="p-0 h-auto">
                    <NavLink
                      to={item.href}
                    >
                      {({ isActive }) => (
                        <div className={cn(
                          "flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                          isActive
                            ? "bg-primary text-leaf-foreground shadow-elevation-12 border border-white/10"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        )}>
                          {React.createElement(item.icon, { 
                            className: cn(
                              "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110", 
                              isActive ? "text-leaf" : ""
                            ) 
                          })}
                          <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-6 border-t border-white/5 bg-black/20">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-leaf animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Sync Health</span>
            </div>
            {totalPending > 0 && (
              <Badge className="bg-leaf h-4 text-[8px] font-black px-1.5 animate-bounce text-white border-none">
                {totalPending}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 px-2">
            <Zap className="h-3 w-3 text-leaf" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Node JHB-1 Online</span>
          </div>
        </div>
        <div className="pt-6 border-t border-white/10 mt-6">
          <Button
            onClick={handleLogout}
            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs bg-[#2E5A35] hover:bg-[#2E5A35]/80 shadow-elevation-12 transition-all active:scale-95 justify-start px-5 gap-3 border-none"
          >
            <LogOut className="h-5 w-5 shrink-0 text-leaf" />
            Secure Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}