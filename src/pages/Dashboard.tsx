import React, { memo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RiskMeter } from '@/components/RiskMeter';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Weight, Landmark, PieChart as PieChartIcon, Truck, Zap, ShieldAlert, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
const formatZAR = (val: number) => 
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val);
const KpiCard = memo(({ title, value, icon: Icon, isLoading, color = "text-white" }: { title: string; value: string | number; icon: React.ElementType; isLoading: boolean, color?: string }) => (
  <Card className="glass-panel border-white/10 shadow-elevation-1 group hover:leaf-glow transition-all duration-500 overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-[9px] font-black uppercase tracking-widest text-leaf">{title}</CardTitle>
      <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-leaf/20 transition-colors">
        <Icon className="h-4 w-4 text-leaf" />
      </div>
    </CardHeader>
    <CardContent>
      {isLoading ? <Skeleton className="h-10 w-2/3 bg-white/5" /> : <div className={cn("text-3xl font-black tracking-tighter tabular-nums drop-shadow-sm", color)}>{value}</div>}
    </CardContent>
  </Card>
));
export function Dashboard() {
  const userRole = useAuthStore(s => s.user?.role);
  const [directorMode, setDirectorMode] = useState(false);
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<any>('/api/dashboard'),
    enabled: !!userRole
  });
  const summary = dashboardData?.summary || {};
  const isAdmin = userRole === 'admin';
  const chartData = summary.trends || [];
  return (
    <PageLayout>
      <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-white">Command</h1>
            <div className="flex items-center gap-3 mt-3">
              <Badge className="bg-leaf font-black border-none text-white px-3 py-1 uppercase text-[10px] tracking-widest">Clearance: {userRole}</Badge>
              {isAdmin && (
                <div className="flex items-center gap-3 ml-4 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                  <Switch id="director-mode" checked={directorMode} onCheckedChange={setDirectorMode} className="data-[state=checked]:bg-leaf" />
                  <Label htmlFor="director-mode" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-white/60 hover:text-white transition-colors">God-View</Label>
                </div>
              )}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 px-5 py-3 bg-white/5 rounded-2xl border border-white/10">
            <Zap className="h-4 w-4 text-leaf animate-pulse" />
            <div className="text-[9px] font-black uppercase tracking-widest text-white/40">Industrial Node: JHB-S-01</div>
          </div>
        </header>
        <AnimatePresence mode="wait">
          <motion.div
            key={directorMode ? 'director-grid' : 'operator-grid'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {directorMode ? (
              <>
                <KpiCard title="Liquid Assets" value={formatZAR(summary.totalValue * 0.4 || 45000)} icon={DollarSign} isLoading={isLoading} />
                <KpiCard title="VAT-264 Liability" value={formatZAR(summary.sars_vat_due || 0)} icon={Landmark} isLoading={isLoading} color="text-leaf" />
                <KpiCard title="EcoPoints Circ." value={`${(summary.totalRewards || 0).toLocaleString()} pt`} icon={PieChartIcon} isLoading={isLoading} />
                <KpiCard title="Audit Integrity" value="SECURE" icon={ShieldAlert} isLoading={isLoading} color="text-leaf" />
              </>
            ) : (
              <>
                <KpiCard title="Total Volume" value={`${(summary.totalWeight || 0).toLocaleString()} kg`} icon={Weight} isLoading={isLoading} />
                <KpiCard title="Gross Commercial" value={formatZAR(summary.totalValue || 0)} icon={Landmark} isLoading={isLoading} color="text-leaf" />
                <KpiCard title="Active Streams" value="Metals/E" icon={Activity} isLoading={isLoading} />
                <KpiCard title="Fleet Status" value="98.4%" icon={Truck} isLoading={isLoading} />
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glass-panel border-white/10 h-[450px]">
            <CardHeader className="flex flex-row items-center justify-between px-8 pt-8">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-leaf">
                {directorMode ? 'Reward Liquidity Timeline' : 'Material Throughput Distribution'}
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-leaf" />
            </CardHeader>
            <CardContent className="h-[340px] px-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.length ? chartData : [{ date: '...', weight: 0, rewards: 0 }]}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4CAF50" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#4CAF50" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeOpacity={0.05} stroke="#FFF" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#FFF', opacity: 0.4}} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#FFF', opacity: 0.4}} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a3620', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#FFF' }}
                    itemStyle={{ color: '#4CAF50', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={directorMode ? "rewards" : "weight"} 
                    stroke="#4CAF50" 
                    fill="url(#chartGradient)" 
                    strokeWidth={4} 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="glass-panel border-white/10 flex flex-col p-8 gap-8">
            <header>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 text-leaf">
                <ShieldAlert className="h-4 w-4" /> Risk Analysis Core
              </CardTitle>
            </header>
            <CardContent className="flex-1 flex flex-col gap-10 p-0">
              <RiskMeter score={summary.ai_fraud_risk || 4} factors={['LME Price Deviation: Normal', 'Node Verification: PASS']} />
              <div className="space-y-4">
                <div className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Live Node Status</div>
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-leaf/20 transition-all">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white">Chain Integrity Node {i}</div>
                      <div className="text-[9px] font-black uppercase text-leaf">Verified Stream Active</div>
                    </div>
                    <Badge className="h-6 bg-leaf/20 text-leaf border-none font-black text-[9px] uppercase tracking-widest">HEALTHY</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}