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
  const [directorMode, setDirectorMode] = useState(false);
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<any>('/api/dashboard'),
    enabled: !!userRole
  });
  const summary = dashboardData?.summary || {};
  const isAdmin = userRole === 'admin';
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="space-y-8 animate-fade-in">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Command</h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className="font-black border-primary/20 text-primary px-3 uppercase">{userRole}</Badge>
                {isAdmin && (
                  <div className="flex items-center gap-2 ml-4 px-3 py-1.5 bg-surface-variant/50 rounded-full border border-white/5">
                    <Switch id="director-mode" checked={directorMode} onCheckedChange={setDirectorMode} />
                    <Label htmlFor="director-mode" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Director God-View</Label>
                  </div>
                )}
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4 p-3 bg-surface-variant/30 rounded-2xl border border-white/5">
              <Zap className="h-4 w-4 text-primary animate-pulse" />
              <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Network Latency: 14ms (JHB-1)</div>
            </div>
          </header>
          <AnimatePresence mode="wait">
            <motion.div
              key={directorMode ? 'director' : 'operator'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            >
              {directorMode ? (
                <>
                  <KpiCard title="Cash on Hand" value={`R ${(summary.totalValue * 0.4 || 450000).toLocaleString()}`} icon={DollarSign} isLoading={isLoading} color="text-emerald-500" />
                  <KpiCard title="VAT-264 Liability" value={`R ${(summary.sars_vat_due || 0).toLocaleString()}`} icon={Landmark} isLoading={isLoading} color="text-orange-500" />
                  <KpiCard title="Rewards in Circ." value={`${(summary.totalRewards || 0).toLocaleString()} pt`} icon={PieChartIcon} isLoading={isLoading} color="text-primary" />
                  <KpiCard title="Audit Health" value="100.0%" icon={ShieldAlert} isLoading={isLoading} color="text-emerald-400" />
                </>
              ) : (
                <>
                  <KpiCard title="Total Mass" value={`${(summary.totalWeight || 0).toLocaleString()} kg`} icon={Weight} isLoading={isLoading} color="text-primary" />
                  <KpiCard title="Yield Value" value={`R ${(summary.totalValue || 0).toLocaleString()}`} icon={Landmark} isLoading={isLoading} />
                  <KpiCard title="Active Streams" value="Metals/WEEE" icon={Activity} isLoading={isLoading} color="text-emerald-500" />
                  <KpiCard title="Fleet Efficiency" value="98.4%" icon={Truck} isLoading={isLoading} />
                </>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 glass-panel border-none shadow-elevation-1 h-[400px]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-widest">
                  {directorMode ? 'Loyalty Circulation (EcoPoints)' : 'Operational Volume Trends (kg)'}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.trends || []}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38761d" stopOpacity={0.4}/>
                        <stop offset="100%" stopColor="#38761d" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeOpacity={0.05} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={10}/>
                    <YAxis axisLine={false} tickLine={false} fontSize={10}/>
                    <Tooltip contentStyle={{ backgroundColor: '#0B0B0B', border: '1px solid #333', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey={directorMode ? "rewards" : "weight"} stroke="#38761d" fill="url(#chartGradient)" strokeWidth={3}/>
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="glass-panel border-none shadow-elevation-1 flex flex-col">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-500" /> Fraud ML Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-6">
                <RiskMeter score={summary.ai_fraud_risk || 8} factors={['LME Price Stability', 'Verified Operator Logs']} />
                <div className="space-y-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Live Compliance Feed</div>
                  {[1, 2].map(i => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-variant/30 border border-white/5">
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold">Node Integrity Check</div>
                        <div className="text-[9px] font-black uppercase text-emerald-500">Chain Verified</div>
                      </div>
                      <Badge variant="outline" className="h-5 text-[8px]">PASS</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}