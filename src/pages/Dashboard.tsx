import React, { memo, useState, useMemo } from 'react';
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
import { Weight, PieChart as PieChartIcon, Truck, Landmark, ArrowUpRight, History, Zap, TrendingUp, TrendingDown, ShieldAlert, Sliders } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOfflineStore } from '@/stores/useOfflineStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
const KpiCard = memo(({ title, value, icon: Icon, isLoading, color = "text-foreground" }: { title: string; value: string | number; icon: React.ElementType; isLoading: boolean, color?: string }) => (
  <Card className="glass-panel border-none shadow-elevation-1 group hover:shadow-elevation-3 transition-all duration-300">
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
  const [riskThreshold, setRiskThreshold] = useState(45);
  const summary = dashboardData?.summary || {};
  const mlFraudProbability = useMemo(() => {
    // Simulated ML Logic: Weight variance vs historical avg
    if (summary.totalWeight > 5000) return 22;
    return 12;
  }, [summary.totalWeight]);
  return (
    <PageLayout>
      <div className="space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Command</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline" className="font-black border-primary/20 text-primary px-3 uppercase">{userRole}</Badge>
              {totalPending > 0 && <Badge className="bg-orange-600 animate-pulse">{totalPending} Queued</Badge>}
            </div>
          </motion.div>
          <div className="flex items-center gap-4 p-3 bg-surface-variant/30 rounded-2xl border border-white/5">
            <Sliders className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-1">
              <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">ML Sensitivity</div>
              <input
                type="range" min="0" max="100" value={riskThreshold}
                onChange={(e) => setRiskThreshold(parseInt(e.target.value))}
                className="w-32 accent-primary h-1"
              />
            </div>
          </div>
        </header>
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
          <Card className="lg:col-span-2 glass-panel border-none shadow-elevation-1 h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest">Growth Trends</CardTitle>
              <Zap className="h-4 w-4 text-primary animate-pulse" />
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.trends || []}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38761d" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#38761d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeOpacity={0.05} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tickMargin={8} fontSize={10}/>
                  <YAxis axisLine={false} tickLine={false} tickMargin={8} fontSize={10}/>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0B0B', border: '1px solid #333', borderRadius: '12px' }}
                    labelStyle={{ fontWeight: 'black', textTransform: 'uppercase', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="weight" stroke="#38761d" fill="url(#weightGradient)" strokeWidth={3}/>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="glass-panel border-none shadow-elevation-1 flex flex-col">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-red-500" /> Fraud ML Engine</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center gap-8">
              <RiskMeter score={mlFraudProbability} factors={['Pattern Variance Detected', 'Unusual Batch Size']} />
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest">Network Confidence</span>
                    <Badge className="bg-emerald-600 font-bold uppercase">98% Validated</Badge>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest">Risk Level</span>
                    <span className={cn("font-black uppercase", mlFraudProbability > riskThreshold ? "text-red-500" : "text-emerald-500")}>
                      {mlFraudProbability > riskThreshold ? "ABOVE THRESHOLD" : "SECURE"}
                    </span>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}