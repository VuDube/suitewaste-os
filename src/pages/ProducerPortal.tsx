import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/PageLayout';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Factory, Leaf, FileCheck, History, BarChart3, PlusCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
const mockTrend = [
  { date: 'Mon', kg: 450 }, { date: 'Tue', kg: 1200 }, { date: 'Wed', kg: 800 }, 
  { date: 'Thu', kg: 1600 }, { date: 'Fri', kg: 900 }, { date: 'Sat', kg: 2100 },
];
export function ProducerPortal() {
  const { data: requests } = useQuery({ queryKey: ['producer-requests'], queryFn: () => api<any[]>('/api/producers/requests') });
  return (
    <PageLayout>
      <div className="space-y-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-display font-bold tracking-tight">Producer ESG Hub</h1>
            <p className="text-muted-foreground text-lg">Monitor industrial waste diversion and compliance.</p>
          </div>
          <Button className="h-14 px-8 text-lg font-bold shadow-glow shadow-primary/20">
            <PlusCircle className="mr-2 h-5 w-5" /> Request Disposal
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-emerald-500 font-bold">Landfill Diversion</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">12.4 Tons</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Leaf className="h-3 w-3 text-emerald-500" /> 15% Increase from last month</p>
            </CardContent>
          </Card>
          <Card className="bg-card/40 border-primary/5">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-bold">EPR Credits Earned</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">ZAR 45,200</div></CardContent>
          </Card>
          <Card className="bg-card/40 border-primary/5">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Compliance Status</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-primary flex items-center gap-2"><FileCheck className="h-6 w-6" /> VERIFIED</div></CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-card/40 backdrop-blur-sm border-border">
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Diverted Volume Trend</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockTrend}>
                  <defs>
                    <linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38761d" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#38761d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis stroke="#888" fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B0B0B', border: '1px solid #333' }} />
                  <Area type="monotone" dataKey="kg" stroke="#38761d" fillOpacity={1} fill="url(#colorKg)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="bg-card/40 border-border">
            <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Recent Collections</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto border rounded-xl">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests?.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs">{new Date(r.request_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-bold">{r.material_type}</TableCell>
                        <TableCell className="font-mono">{r.estimated_weight}kg</TableCell>
                        <TableCell><Badge variant="outline" className="uppercase text-[10px]">{r.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}