import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/PageLayout';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatZAR } from '@/lib/finance-utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, Landmark, Receipt, FileSpreadsheet, Loader2, TrendingUp, CheckCircle2, Building2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
export function FinanceLedger() {
  const { data: financeData, isLoading } = useQuery({ queryKey: ['finance-summary'], queryFn: () => api<any>('/api/finance/vat-report') });
  const { data: glSummary } = useQuery({ queryKey: ['gl-summary'], queryFn: () => api<any[]>('/api/finance/gl-summary') });
  const [approving, setApproving] = useState(false);
  const handleBankservDispatch = () => {
    setApproving(true);
    setTimeout(() => {
      toast.success("Bankserv Bulk EFT Dispatched", {
        description: "Batch #BS-9928 authorized for immediate settlement."
      });
      setApproving(false);
    }, 2000);
  };
  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </PageLayout>
    );
  }
  return (
    <PageLayout>
      <div className="space-y-10 max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black uppercase tracking-tighter">Finance</h1>
            <p className="text-muted-foreground text-lg italic flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Bankserv Bulk EFT Approval Workflow
            </p>
          </div>
          <Button onClick={handleBankservDispatch} disabled={approving} className="h-14 px-8 font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20">
            {approving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />} Dispatch Batch
          </Button>
        </header>
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-surface-variant/50 p-1.5 rounded-2xl h-16 flex gap-2">
            <TabsTrigger value="overview" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs">Overview</TabsTrigger>
            <TabsTrigger value="payouts" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs">EFT Approval</TabsTrigger>
            <TabsTrigger value="vat" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs">VAT-264</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-8 animate-fade-in">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="bg-card border-none shadow-elevation-1">
                <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">VAT-201 Accrual</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-black text-primary tracking-tighter">{formatZAR(financeData?.vat_amount || 0)}</div></CardContent>
              </Card>
              <Card className="bg-card border-none shadow-elevation-1">
                <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Net Purchases</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-black tracking-tighter">{formatZAR(financeData?.net_amount || 0)}</div></CardContent>
              </Card>
              <Card className="bg-destructive/5 border-none shadow-elevation-1">
                <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-red-500 tracking-widest">EPR Liability</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-black text-red-500 tracking-tighter">R 12,450.00</div></CardContent>
              </Card>
            </div>
            <Card className="glass-panel border-none shadow-elevation-1 h-[400px]">
              <CardHeader><CardTitle className="text-xs font-black uppercase tracking-widest">Cash Flow Distribution</CardTitle></CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: 'Net', val: financeData?.net_amount }, { name: 'VAT', val: financeData?.vat_amount }, { name: 'Gross', val: financeData?.gross_amount }]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} />
                    <Tooltip cursor={{ fill: 'rgba(56, 118, 29, 0.05)' }} contentStyle={{ backgroundColor: '#0B0B0B', border: '1px solid #333' }} />
                    <Bar dataKey="val" fill="#38761d" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="payouts" className="space-y-6 animate-fade-in">
            <Card className="glass-panel border-none shadow-elevation-1">
              <CardHeader><CardTitle className="text-xs font-black uppercase tracking-widest">EFT Batch: BS-9928 (Draft)</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-surface-variant/30">
                    <TableRow className="border-b-white/5">
                      <TableHead className="px-6 h-14">Payee</TableHead>
                      <TableHead className="px-6 h-14">Bank Account</TableHead>
                      <TableHead className="px-6 h-14 text-right">Amount (ZAR)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1,2,3].map(i => (
                      <TableRow key={i} className="border-b-white/5 hover:bg-white/5">
                        <TableCell className="px-6 py-5 font-bold">Industrial Vendor #{i}</TableCell>
                        <TableCell className="px-6 py-5 font-mono text-[10px] text-muted-foreground">FNB • ****8821</TableCell>
                        <TableCell className="px-6 py-5 text-right font-black tracking-tighter">R 15,400.00</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}