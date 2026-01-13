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
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <KpiCard title="PET" value={`${(summary.materialBreakdown?.PET || 0).toLocaleString()} kg`} icon={PieChartIcon} isLoading={isLoading} color="text-emerald-500" />
          <KpiCard title="HDPE" value={`${(summary.materialBreakdown?.HDPE || 0).toLocaleString()} kg`} icon={PieChartIcon} isLoading={isLoading} color="text-blue-500" />
          <KpiCard title="Al" value={`${(summary.materialBreakdown?.Al || 0).toLocaleString()} kg`} icon={PieChartIcon} isLoading={isLoading} color="text-orange-500" />
          <KpiCard title="Paper" value={`${(summary.materialBreakdown?.Paper || 0).toLocaleString()} kg`} icon={PieChartIcon} isLoading={isLoading} color="text-amber-500" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="glass-panel border-none shadow-elevation-3 h-[300px]">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">Trends</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData?.summary?.trends || []}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tickMargin={8}/>
                  <YAxis axisLine={false} tickLine={false} tickMargin={8}/>
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="weight" stroke="#8884d8" fill="url(#weightGradient)" strokeWidth={2}/>
                  <Area type="monotone" dataKey="value" stroke="#82ca9d" fillOpacity={0.3} strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="glass-panel border-none shadow-elevation-3">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">AI Fraud Risk</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[250px]">
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart data={[{ riskMeter: dashboardData?.summary?.ai_fraud_risk || 0 }]} cx="50%" cy="50%" innerRadius="40%" outerRadius="80%" barSize={20}>
                  <RadialBar background={{ cornerRadius: 10 }} dataKey="riskMeter" minAngle={15} clockWise minPointSize={10}>
                    <Cell fill={dashboardData?.summary?.ai_fraud_risk < 10 ? '#82ca9d' : dashboardData?.summary?.ai_fraud_risk <= 20 ? '#fbbf24' : '#ef4444'} />
                  </RadialBar>
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="mt-4 text-2xl font-black">
                {`${(dashboardData?.summary?.ai_fraud_risk || 0).toFixed(1)}%`}
              </div>
            </CardContent>
          </Card>
        </div>

        {(() => {
          const isDirector = userRole === 'admin' || userRole === 'auditor';
          const lme = summary.lme_prices || {};
          const vat_due = summary.vat_due || 0;
          if (isDirector) {
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="glass-panel border-none shadow-elevation-3">
                  <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest">LME Prices</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between"><span className="font-bold">Aluminium:</span><span>{lme?.Aluminium?.toLocaleString()} ZAR/t</span></div>
                    <div className="flex justify-between"><span className="font-bold">Copper:</span><span>{lme?.Copper?.toLocaleString()} ZAR/t</span></div>
                  </CardContent>
                </Card>
                <Card className="glass-panel border-none shadow-elevation-3">
                  <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest">SARS VAT Due</CardTitle>
                  </CardHeader>
                  <CardContent className="text-3xl font-black text-center pt-4">
                    R{vat_due.toLocaleString()}
                  </CardContent>
                </Card>
              </div>
            );
          }
          return null;
        })()}

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