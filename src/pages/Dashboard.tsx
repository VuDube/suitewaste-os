import React, { memo, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowRight, Weight, PieChart as PieChartIcon, Settings, Briefcase, Landmark, Truck, ShoppingCart, Bell, Cable } from 'lucide-react';
import { format } from 'date-fns';
import type { InventoryLedgerEntry, Transaction, StaffMember } from '@shared/types';
import { useOfflineStore } from '@/stores/useOfflineStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
const KpiCard = memo(({ title, value, icon: Icon, isLoading, color = "text-foreground" }: { title: string; value: string | number; icon: React.ElementType; isLoading: boolean, color?: string }) => (
  <Card className="group hover:-translate-y-1 transition-all duration-300 backdrop-blur-xl shadow-soft hover:shadow-primary/20 bg-card/60 border-primary/5 overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
      <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-4 w-4 text-primary" />
      </div>
    </CardHeader>
    <CardContent>
      {isLoading ? <Skeleton className="h-10 w-3/4 animate-pulse" /> : <div className={cn("text-3xl font-bold tabular-nums tracking-tighter", color)}>{value}</div>}
    </CardContent>
  </Card>
));
const DashboardContent = memo(() => {
  const { user } = useAuth();
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({ queryKey: ['dashboard'], queryFn: () => api<any>('/api/dashboard'), enabled: !!user });
  const { data: vehicles } = useQuery({ queryKey: ['vehicles'], queryFn: () => api<any[]>('/api/fleet/vehicles'), enabled: !!user && ['admin', 'manager'].includes(user.role) });
  const summary = dashboardData?.summary || {};
  const isLoading = isLoadingDashboard;
  if (!user) return null;
  const isAdminOrManager = ['admin', 'manager'].includes(user.role);
  return (
    <Suspense fallback={<div className="py-12"><Skeleton className="h-48 w-full" /></div>}>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {user.role === 'operator' ? (
          <>
            <Card className="md:col-span-2 lg:col-span-4 bg-gradient-to-br from-primary/15 to-transparent border-primary/10 overflow-hidden relative group">
              <div className="absolute right-0 top-0 h-full w-1/3 bg-primary/5 blur-3xl -z-10 group-hover:scale-150 transition-transform duration-1000"></div>
              <CardContent className="flex flex-col sm:flex-row gap-8 items-center p-10">
                <div className="flex-1 space-y-3">
                  <h2 className="text-3xl font-bold tracking-tight">Active Collection Node</h2>
                  <p className="text-muted-foreground text-lg">Perform industrial weighing and EPR data capture.</p>
                </div>
                <Button asChild size="lg" className="font-bold text-xl h-20 w-full sm:w-auto shadow-primary/40 shadow-2xl px-12 transition-transform hover:scale-105">
                  <Link to="/quick-weight"><Weight className="mr-3 h-8 w-8" /> Start Weighing</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-2 bg-card/40 border-border">
              <CardHeader><CardTitle className="text-lg font-bold uppercase tracking-widest text-muted-foreground">Local Health</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-accent/20 border border-border"><span className="flex items-center gap-3 font-bold"><Cable className="h-5 w-5 text-primary" /> Scale Link</span><Badge className="bg-emerald-600 font-bold">STABLE</Badge></div>
              </CardContent>
            </Card>
          </>
        ) : user.role === 'buyer' ? (
          <Card className="md:col-span-4 bg-card/60 border-primary/10">
            <CardContent className="p-12 text-center space-y-4">
              <ShoppingCart className="h-16 w-16 text-primary mx-auto" />
              <h2 className="text-3xl font-bold">Ready to Acquire?</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">Browse the marketplace for EPR-certified materials from our verified network.</p>
              <Button asChild size="lg" className="h-14 px-10 font-bold mt-4"><Link to="/marketplace">Enter Marketplace</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <KpiCard title="Total Weight" value={`${summary.totalWeight?.toLocaleString() || 0} kg`} icon={Weight} isLoading={isLoading} color="text-primary" />
            <KpiCard title="Market Sales" value={`R${(summary.totalValue || 0).toLocaleString()}`} icon={Landmark} isLoading={isLoading} />
            <KpiCard title="Fleet Status" value={`${vehicles?.filter(v => v.status === 'active').length || 0} / ${vehicles?.length || 0}`} icon={Truck} isLoading={isLoading} />
            <KpiCard title="EPR Compliance" value={`${summary.weeePct?.toFixed(1) || 0}%`} icon={PieChartIcon} isLoading={isLoading} color="text-emerald-500" />
            <Card className="col-span-1 lg:col-span-4 bg-primary/10 border-primary/20 group hover:bg-primary/15 transition-all shadow-glow shadow-primary/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl font-bold uppercase tracking-tighter"><Settings className="h-6 w-6 text-primary group-hover:rotate-45 transition-transform duration-500" /> Enterprise Control Center</CardTitle>
                <div className="flex gap-4">
                  <Button asChild className="h-12 font-bold" variant="default"><Link to="/fleet">Logistics</Link></Button>
                  <Button asChild className="h-12 font-bold" variant="outline"><Link to="/finance">Treasury</Link></Button>
                </div>
              </CardHeader>
            </Card>
          </>
        )}
      </div>
    </Suspense>
  );
});
export function Dashboard() {
  const { user } = useAuth();
  const totalPending = useOfflineStore(s => s.totalPending());
  return (
    <PageLayout>
      <div className="space-y-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-5xl font-display font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">SuiteWaste OS</h1>
            <p className="text-muted-foreground text-xl font-medium border-l-4 border-primary pl-4 py-1 mt-2">
              Enterprise Hub — <span className="text-foreground font-bold uppercase tracking-tighter">{user?.role}</span>
            </p>
          </motion.div>
          {totalPending > 0 && (
            <Alert className="bg-yellow-500/10 border-yellow-500/30 backdrop-blur-md shadow-glow shadow-yellow-500/10 w-full sm:w-auto">
              <Bell className="h-5 w-5 text-yellow-500" />
              <AlertTitle className="text-yellow-500 font-black uppercase tracking-widest text-xs mb-1">Pending Sync</AlertTitle>
              <AlertDescription className="text-yellow-100 font-bold">{totalPending} records in queue.</AlertDescription>
            </Alert>
          )}
        </div>
        <DashboardContent />
      </div>
    </PageLayout>
  );
}