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
import { ArrowRight, BarChart, Bell, BookOpen, Cable, Camera, Users, Weight, PieChart as PieChartIcon, Settings } from 'lucide-react';
import { format } from 'date-fns';
import type { InventoryLedgerEntry, Supplier, Transaction, EPRReport } from '@shared/types';
import { useOfflineStore } from '@/stores/useOfflineStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
const KpiCard = memo(({ title, value, icon: Icon, isLoading }: { title: string; value: string | number; icon: React.ElementType; isLoading: boolean }) => (
  <Card className="group hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 backdrop-blur-xl shadow-glow shadow-primary/10 hover:shadow-primary/30 bg-card/60 border-primary/10">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-primary/70" />
    </CardHeader>
    <CardContent>
      {isLoading ? <Skeleton className="h-10 w-3/4 animate-pulse" /> : <div className="text-[clamp(1.5rem,5vw,2.25rem)] font-bold tabular-nums tracking-tight">{value}</div>}
    </CardContent>
  </Card>
));
const RecentActivityTable = memo(({ title, data, columns, isLoading, viewAllLink }: { title: string; data: any[]; columns: { header: string; accessor: (item: any) => React.ReactNode }[]; isLoading: boolean; viewAllLink?: string }) => (
  <Card className="col-span-1 lg:col-span-2 backdrop-blur-xl shadow-md bg-card/40 border-primary/5">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-lg font-bold">{title}</CardTitle>
      {viewAllLink && <Button asChild variant="link" className="text-primary hover:text-primary/80"><Link to={viewAllLink} className="flex items-center gap-1">View All <ArrowRight className="h-4 w-4" /></Link></Button>}
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent border-primary/10">{columns.map(c => <TableHead key={c.header} className="text-xs font-bold uppercase">{c.header}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 3 }).map((_, i) => <TableRow key={i}>{columns.map((c, j) => <TableCell key={j}><Skeleton className="h-6 w-full animate-pulse" /></TableCell>)}</TableRow>)
             : data && data.length > 0 ? data.map((item, i) => <TableRow key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both border-primary/5 hover:bg-primary/5 transition-colors" style={{ animationDelay: `${i * 50}ms` }}>{columns.map(c => <TableCell key={c.header}>{c.accessor(item)}</TableCell>)}</TableRow>)
             : <TableRow><TableCell colSpan={columns.length} className="text-center h-24 text-muted-foreground">No recent activity records.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
));
const DashboardContent = memo(() => {
  const { user } = useAuth();
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({ queryKey: ['dashboard'], queryFn: () => api<any>('/api/dashboard'), enabled: !!user });
  const { data: eprData, isLoading: isLoadingEpr } = useQuery({ queryKey: ['epr-report'], queryFn: () => api<EPRReport>('/api/epr-report'), enabled: !!user && (user.role === 'admin' || user.role === 'auditor') });
  const summary = dashboardData?.summary || {};
  const isLoading = isLoadingDashboard || (user && ['admin', 'auditor'].includes(user.role) && isLoadingEpr);
  if (!user) return null;
  return (
    <Suspense fallback={<div className="py-12"><Skeleton className="h-48 w-full" /></div>}>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {user.role === 'operator' ? (
          <>
            <Card className="md:col-span-2 lg:col-span-4 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
              <CardContent className="flex flex-col sm:flex-row gap-6 items-center p-8">
                <div className="flex-1 space-y-2">
                  <h2 className="text-2xl font-bold">New Collection Session</h2>
                  <p className="text-muted-foreground">Perform industrial weighing and EPR data capture for local suppliers.</p>
                </div>
                <Button asChild size="lg" className="font-bold text-lg h-14 w-full sm:w-auto shadow-primary/30 shadow-lg px-8">
                  <Link to="/quick-weight"><Weight className="mr-2 h-6 w-6" /> Start Weighing</Link>
                </Button>
              </CardContent>
            </Card>
            <RecentActivityTable title="Recent Transactions" data={summary.recentTransactions || []} isLoading={isLoading} viewAllLink="/transactions" columns={[{ header: 'Reference', accessor: (t: Transaction) => <span className="font-mono text-xs text-muted-foreground">{t.id.substring(0, 8)}</span> }, { header: 'Value', accessor: (t: Transaction) => <span className="font-semibold tabular-nums">ZAR {t.amount.toFixed(2)}</span> }, { header: 'Time', accessor: (t: Transaction) => format(new Date(t.transaction_timestamp), 'HH:mm') }]} />
            <Card className="col-span-1 lg:col-span-2 bg-card/40 border-primary/10">
              <CardHeader><CardTitle className="text-lg font-bold">Edge Diagnostics</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5"><span className="flex items-center gap-2 font-medium"><Cable className="h-4 w-4" /> Serial Scale</span><Badge className="bg-emerald-600">Online</Badge></div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5"><span className="flex items-center gap-2 font-medium"><Camera className="h-4 w-4" /> Snapshot Proxy</span><Badge className="bg-emerald-600">Active</Badge></div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <KpiCard title="Total Inventory (kg)" value={summary.totalWeight?.toLocaleString() || 0} icon={Weight} isLoading={isLoading} />
            <KpiCard title="Total Value (ZAR)" value={summary.totalValue?.toLocaleString() || 0} icon={BarChart} isLoading={isLoading} />
            <KpiCard title="EPR Compliance" value={`${eprData?.compliance_pct.toFixed(1) || summary.weeePct?.toFixed(1) || 0}%`} icon={PieChartIcon} isLoading={isLoading} />
            <KpiCard title="Suppliers" value={summary.recentSuppliers?.length || 0} icon={Users} isLoading={isLoading} />
            <RecentActivityTable title="Recent Ledger" data={summary.recentLedger || []} isLoading={isLoading} viewAllLink="/ledger" columns={[{ header: 'Material', accessor: (l: InventoryLedgerEntry) => <span className="font-medium">{l.material_type}</span> }, { header: 'Weight', accessor: (l: InventoryLedgerEntry) => <span className="tabular-nums">{l.weight_kg.toFixed(2)} kg</span> }, { header: 'Timestamp', accessor: (l: InventoryLedgerEntry) => format(new Date(l.capture_timestamp), 'MMM d, HH:mm') }]} />
            <Card className="col-span-1 lg:col-span-2 bg-primary/10 border-primary/20 group hover:bg-primary/15 transition-colors">
              <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Quick Controls</CardTitle></CardHeader>
              <CardContent className="flex gap-2">
                <Button asChild className="flex-1 h-12 text-sm font-semibold" variant="default"><Link to="/settings">System Settings</Link></Button>
                <Button asChild className="flex-1 h-12 text-sm font-semibold" variant="outline"><Link to="/suppliers">Add Supplier</Link></Button>
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
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-display font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Dashboard</h1>
            <p className="text-muted-foreground text-lg italic">Compliance Operating System for {user?.username}</p>
          </div>
          {totalPending > 0 && (
            <Alert className="w-full sm:w-auto bg-yellow-500/10 border-yellow-500/30 backdrop-blur-md">
              <Bell className="h-4 w-4 text-yellow-500" />
              <AlertTitle className="text-yellow-500 font-bold">Offline Queue Active</AlertTitle>
              <AlertDescription className="text-yellow-200/80">{totalPending} records waiting for sync.</AlertDescription>
            </Alert>
          )}
        </div>
        <DashboardContent />
      </div>
    </PageLayout>
  );
}