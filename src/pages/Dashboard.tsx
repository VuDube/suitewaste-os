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
import { ArrowRight, BarChart, Bell, BookOpen, Cable, Camera, Users, Weight, PieChart as PieChartIcon, Settings, Briefcase, Landmark } from 'lucide-react';
import { format } from 'date-fns';
import type { InventoryLedgerEntry, Supplier, Transaction, EPRReport, StaffMember } from '@shared/types';
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
const RecentActivityTable = memo(({ title, data, columns, isLoading, viewAllLink }: { title: string; data: any[]; columns: { header: string; accessor: (item: any) => React.ReactNode }[]; isLoading: boolean; viewAllLink?: string }) => (
  <Card className="col-span-1 lg:col-span-2 backdrop-blur-xl shadow-soft bg-card/40 border-primary/5">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-lg font-bold uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
      {viewAllLink && <Button asChild variant="link" className="text-primary font-bold hover:translate-x-1 transition-transform"><Link to={viewAllLink} className="flex items-center gap-1">View All <ArrowRight className="h-4 w-4" /></Link></Button>}
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto border rounded-xl">
        <Table>
          <TableHeader><TableRow className="bg-muted/30">{columns.map(c => <TableHead key={c.header} className="text-[10px] font-bold uppercase tracking-widest">{c.header}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 3 }).map((_, i) => <TableRow key={i}>{columns.map((c, j) => <TableCell key={j}><Skeleton className="h-6 w-full animate-pulse" /></TableCell>)}</TableRow>)
             : data && data.length > 0 ? data.map((item, i) => <TableRow key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-300 hover:bg-primary/5 transition-colors" style={{ animationDelay: `${i * 50}ms` }}>{columns.map(c => <TableCell key={c.header} className="text-sm">{c.accessor(item)}</TableCell>)}</TableRow>)
             : <TableRow><TableCell colSpan={columns.length} className="text-center h-24 text-muted-foreground italic">No recent activity records.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
));
const DashboardContent = memo(() => {
  const { user } = useAuth();
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({ queryKey: ['dashboard'], queryFn: () => api<any>('/api/dashboard'), enabled: !!user });
  const { data: staffData } = useQuery({ queryKey: ['staff'], queryFn: () => api<StaffMember[]>('/api/hr/staff'), enabled: !!user && ['admin', 'manager'].includes(user.role) });
  const summary = dashboardData?.summary || {};
  const isLoading = isLoadingDashboard;
  if (!user) return null;
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
                  <p className="text-muted-foreground text-lg">Perform industrial weighing and EPR data capture for local suppliers.</p>
                </div>
                <Button asChild size="lg" className="font-bold text-xl h-20 w-full sm:w-auto shadow-primary/40 shadow-2xl px-12 group-hover:scale-[1.05] transition-transform">
                  <Link to="/quick-weight"><Weight className="mr-3 h-8 w-8" /> Start Weighing</Link>
                </Button>
              </CardContent>
            </Card>
            <RecentActivityTable title="Today's Collections" data={summary.recentTransactions || []} isLoading={isLoading} viewAllLink="/transactions" columns={[{ header: 'ID', accessor: (t: Transaction) => <span className="font-mono text-xs text-muted-foreground">{t.id.substring(0, 8)}</span> }, { header: 'Value', accessor: (t: Transaction) => <span className="font-bold text-primary">ZAR {t.amount.toFixed(2)}</span> }, { header: 'Time', accessor: (t: Transaction) => format(new Date(t.transaction_timestamp), 'HH:mm') }]} />
            <Card className="col-span-1 lg:col-span-2 bg-card/40 border-border">
              <CardHeader><CardTitle className="text-lg font-bold uppercase tracking-widest text-muted-foreground">Terminal Diagnostics</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-accent/20 border border-border"><span className="flex items-center gap-3 font-bold"><Cable className="h-5 w-5 text-primary" /> Multi-Scale Node</span><Badge className="bg-emerald-600 font-bold">LOCKED</Badge></div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-accent/20 border border-border"><span className="flex items-center gap-3 font-bold"><Camera className="h-5 w-5 text-primary" /> R2 Proxy</span><Badge className="bg-emerald-600 font-bold">READY</Badge></div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <KpiCard title="Inventory Weight" value={`${summary.totalWeight?.toLocaleString() || 0} kg`} icon={Weight} isLoading={isLoading} color="text-primary" />
            <KpiCard title="Gross Sales" value={`R${(summary.totalValue || 0).toLocaleString()}`} icon={Landmark} isLoading={isLoading} />
            <KpiCard title="Active Staff" value={staffData?.filter(s => s.clock_status === 'in').length || 0} icon={Briefcase} isLoading={isLoading} />
            <KpiCard title="Compliance Rate" value={`${summary.weeePct?.toFixed(1) || 0}%`} icon={PieChartIcon} isLoading={isLoading} color="text-emerald-500" />
            <RecentActivityTable title="Industrial Ledger" data={summary.recentLedger || []} isLoading={isLoading} viewAllLink="/ledger" columns={[{ header: 'Material', accessor: (l: InventoryLedgerEntry) => <span className="font-bold">{l.material_type}</span> }, { header: 'Weight', accessor: (l: InventoryLedgerEntry) => <span className="font-mono font-bold text-primary">{l.weight_kg.toFixed(2)} kg</span> }, { header: 'Time', accessor: (l: InventoryLedgerEntry) => format(new Date(l.capture_timestamp), 'MMM d, HH:mm') }]} />
            <Card className="col-span-1 lg:col-span-2 bg-primary/10 border-primary/20 group hover:bg-primary/15 transition-all shadow-glow shadow-primary/5">
              <CardHeader><CardTitle className="flex items-center gap-3 text-xl font-bold uppercase tracking-tighter"><Settings className="h-6 w-6 text-primary group-hover:rotate-45 transition-transform duration-500" /> Administrative Hub</CardTitle></CardHeader>
              <CardContent className="flex gap-4">
                <Button asChild className="flex-1 h-14 text-base font-bold shadow-soft" variant="default"><Link to="/finance">Financial Control</Link></Button>
                <Button asChild className="flex-1 h-14 text-base font-bold shadow-soft" variant="outline"><Link to="/staff">Staff Roster</Link></Button>
              </CardContent>
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
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <h1 className="text-5xl font-display font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Dashboard</h1>
            <p className="text-muted-foreground text-xl font-medium border-l-4 border-primary pl-4 py-1">
              Industrial Compliance OS — <span className="text-foreground font-bold">{user?.username}</span>
            </p>
          </motion.div>
          {totalPending > 0 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full sm:w-auto"
            >
              <Alert className="bg-yellow-500/10 border-yellow-500/30 backdrop-blur-md shadow-glow shadow-yellow-500/10">
                <Bell className="h-5 w-5 text-yellow-500" />
                <AlertTitle className="text-yellow-500 font-black uppercase tracking-widest text-xs mb-1">Local Sync Queue</AlertTitle>
                <AlertDescription className="text-yellow-100 font-bold">{totalPending} Industrial records waiting for edge synchronization.</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </div>
        <DashboardContent />
      </div>
    </PageLayout>
  );
}