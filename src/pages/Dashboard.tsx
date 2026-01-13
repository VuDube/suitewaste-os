import React, { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RiskMeter } from '@/components/RiskMeter';
import { useLME } from '@/hooks/useLME';
import { Weight, PieChart as PieChartIcon, Truck, Landmark, ArrowUpRight, History, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOfflineStore } from '@/stores/useOfflineStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadialBarChart, RadialBar, Cell } from 'recharts';
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
  const { prices } = useLME();
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
              <Badge variant="outline" className="font-black border-primary/20 text-primary px-3 uppercase">{userRole}</Badge>
              {totalPending > 0 && <Badge className="bg-orange-600 animate-pulse">{totalPending} Queued</Badge>}
            </div>
          </motion.div>
        </header>
        {/* LME Live Ticker */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
          {prices.map(price => (
            <Card key={price.id} className="min-w-[180px] bg-card/40 border-white/5 shadow-elevation-1">
              <CardContent className="p-4 flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase text-muted-foreground">{price.name}</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold">R{price.priceZAR.toFixed(2)}</span>
                  <div className={cn("flex items-center text-[10px] font-bold", price.changePct >= 0 ? "text-emerald-500" : "text-red-500")}>
                    {price.changePct >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {Math.abs(price.changePct).toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <KpiCard title="Mass Total" value={`${(summary.totalWeight || 0).toLocaleString()} kg`} icon={Weight} isLoading={isLoading} color="text-primary" />
          <KpiCard title="Yield Value" value={`R${(summary.totalValue || 0).toLocaleString()}`} icon={Landmark} isLoading={isLoading} />
          <KpiCard title="EPR Score" value={`${(summary.weeePct || 0).toFixed(1)}%`} icon={PieChartIcon} isLoading={isLoading} color="text-emerald-500" />
          <KpiCard title="Fleet Nodes" value={summary.fleet_efficiency ? `${summary.fleet_efficiency}%` : "100%"} icon={Truck} isLoading={isLoading} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glass-panel border-none shadow-elevation-3 h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest">Growth Trends</CardTitle>
              <Zap className="h-4 w-4 text-primary animate-pulse" />
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData?.summary?.trends || []}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38761d" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#38761d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeOpacity={0.05} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tickMargin={8} fontSize={10}/>
                  <YAxis axisLine={false} tickLine={false} tickMargin={8} fontSize={10}/>
                  <Tooltip contentStyle={{ backgroundColor: '#0B0B0B', border: '1px solid #333', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="weight" stroke="#38761d" fill="url(#weightGradient)" strokeWidth={3}/>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="glass-panel border-none shadow-elevation-3 flex flex-col">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">Operations Integrity</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center gap-8">
              <RiskMeter score={summary.ai_fraud_risk || 12} factors={['High Volume Variance', 'Frequent Vendor']} />
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-bold uppercase">System Status</span>
                    <Badge className="bg-emerald-600 font-bold">OPTIMIZED</Badge>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-bold uppercase">Chain Linkage</span>
                    <span className="text-primary font-black">100% SECURE</span>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glass-panel border-none p-1">
            <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><History className="h-4 w-4" /> Live Operations Feed</CardTitle></CardHeader>
            <CardContent className="p-0">
               <div className="flex flex-col">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center justify-between p-5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors touch-haptic group">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-surface-variant flex items-center justify-center font-black text-xs">TRX</div>
                          <div>
                            <div className="font-bold text-sm">Industrial Collection #{1000 + i}</div>
                            <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Copper Grade A • Jozi Scrap</div>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <div className="text-sm font-black text-primary">R 12,450.00</div>
                            <div className="text-[9px] font-bold text-muted-foreground">08:45 AM</div>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                       </div>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
          <section className="space-y-6">
            <Card className="bg-primary shadow-elevation-12 border-none relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
              <CardContent className="p-8 flex flex-col items-center text-center text-primary-foreground space-y-4 relative z-10">
                 <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-2">
                   <Weight className="h-8 w-8" />
                 </div>
                 <h3 className="text-xl font-black uppercase tracking-tighter">Initialize POS</h3>
                 <p className="text-xs font-bold opacity-80 max-w-[200px]">Secure industrial weight capture with real-time LME pricing.</p>
                 <Button asChild variant="secondary" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest touch-haptic shadow-lg">
                    <Link to="/quick-weight">Start Weighing</Link>
                 </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}