import React, { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Weight, PieChart as PieChartIcon, Truck, ShoppingCart, Landmark, ArrowUpRight, History } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOfflineStore } from '@/stores/useOfflineStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
const KpiCard = memo(({ title, value, icon: Icon, isLoading, color = "text-foreground" }: { title: string; value: string | number; icon: React.ElementType; isLoading: boolean, color?: string }) => (
  <Card className="glass-panel border-none shadow-elevation-3 group hover:shadow-elevation-6 transition-all duration-300">
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
      <div className="p-2 rounded-xl bg-surface-variant group-hover:bg-primary/20 transition-colors">
        <Icon className="h-4 w-4 text-primary" />
      </div>
    </CardHeader>
    <CardContent>
      {isLoading ? <Skeleton className="h-8 w-2/3" /> : <div className={cn("text-2xl font-black tracking-tighter tabular-nums", color)}>{value}</div>}
    </CardContent>
  </Card>
));
export function Dashboard() {
  const userRole = useAuthStore(s => s.user?.role);
  const pendingLedgerCount = useOfflineStore(s => s.pendingLedgerEntries.length);
  const pendingTransactionCount = useOfflineStore(s => s.pendingTransactions.length);
  const totalPending = pendingLedgerCount + pendingTransactionCount;
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<any>('/api/dashboard'),
    enabled: !!userRole
  });
  const summary = dashboardData?.summary || {};
  return (
    <PageLayout>
      <div className="space-y-10">
        <header className="flex flex-col gap-2">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Command</h1>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-black border-primary/20 text-primary px-3">{userRole}</Badge>
              {totalPending > 0 && <Badge className="bg-orange-600 animate-pulse">{totalPending} Queued</Badge>}
            </div>
          </motion.div>
        </header>
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <KpiCard title="Mass Total" value={`${(summary.totalWeight || 0).toLocaleString()} kg`} icon={Weight} isLoading={isLoading} color="text-primary" />
          <KpiCard title="Yield Value" value={`R${(summary.totalValue || 0).toLocaleString()}`} icon={Landmark} isLoading={isLoading} />
          <KpiCard title="EPR Score" value={`${(summary.weeePct || 0).toFixed(1)}%`} icon={PieChartIcon} isLoading={isLoading} color="text-emerald-500" />
          <KpiCard title="Fleet Nodes" value={summary.fleet_efficiency ? `${summary.fleet_efficiency}%` : "100%"} icon={Truck} isLoading={isLoading} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glass-panel border-none p-1">
            <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><History className="h-4 w-4" /> Operations Stream</CardTitle></CardHeader>
            <CardContent className="p-0">
               <div className="flex flex-col">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors touch-haptic group">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-surface-variant flex items-center justify-center font-black">#{i}</div>
                          <div>
                            <div className="font-bold text-sm">Industrial Scrap A</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-black">Ref: POS-00{i}</div>
                          </div>
                       </div>
                       <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
          <section className="space-y-6">
            <Card className="bg-primary shadow-elevation-12 border-none">
              <CardContent className="p-8 flex flex-col items-center text-center text-primary-foreground space-y-4">
                 <Weight className="h-12 w-12" />
                 <h3 className="text-xl font-black uppercase tracking-tighter">Quick Weigh</h3>
                 <p className="text-sm font-bold opacity-80">Launch industrial scale interface.</p>
                 <Button asChild variant="secondary" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest touch-haptic">
                    <Link to="/quick-weight">Initialize POS</Link>
                 </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}