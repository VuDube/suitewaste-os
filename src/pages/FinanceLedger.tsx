import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/PageLayout';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatZAR } from '@/lib/finance-utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, Landmark, Receipt, FileSpreadsheet, Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
export function FinanceLedger() {
  const { data: financeData, isLoading } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => api<any>('/api/finance/vat-report')
  });
  const { data: glSummary } = useQuery({
    queryKey: ['gl-summary'],
    queryFn: () => api<any[]>('/api/finance/gl-summary')
  });
  const chartData = [
    { name: 'Net', val: financeData?.net_amount || 0, color: '#38761d' },
    { name: 'VAT', val: financeData?.vat_amount || 0, color: '#5a9a47' },
    { name: 'Gross', val: financeData?.gross_amount || 0, color: '#2f6a1a' },
  ];
  const handleSARSExport = () => {
    toast.success("SARS VAT201 Report Exported", {
      description: "Submission file generated for the current tax period."
    });
  };
  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }
  return (
    <PageLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-display font-bold tracking-tight">Finance Ledger</h1>
            <p className="text-muted-foreground italic flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              SARS VAT-201 Compliance Framework (ZAR)
            </p>
          </motion.div>
          <Button onClick={handleSARSExport} className="h-14 gap-2 shadow-primary/20 shadow-lg px-6 text-lg font-bold">
            <Download className="h-5 w-5" /> Export for SARS
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { label: 'Total Output VAT', value: financeData?.vat_amount, color: 'text-primary', bg: 'bg-primary/5' },
            { label: 'Total Net Sales', value: financeData?.net_amount, color: 'text-foreground', bg: 'bg-card' },
            { label: 'Liability Accrual', value: financeData?.vat_amount, color: 'text-destructive', bg: 'bg-destructive/5' }
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`${kpi.bg} border-border/50 shadow-soft`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{kpi.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold tabular-nums ${kpi.color}`}>{formatZAR(kpi.value || 0)}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-glow shadow-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" /> Financial Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(56, 118, 29, 0.05)' }}
                    contentStyle={{ backgroundColor: '#0B0B0B', border: '1px solid #333', borderRadius: '8px' }}
                    formatter={(v: number) => [formatZAR(v), 'Value']}
                  />
                  <Bar dataKey="val" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Quick Audit</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-xl hover:bg-accent/5 transition-all cursor-pointer group border-border/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-tighter">VAT-201 Current</span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">ACTIVE</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Consolidated report for H2-2024 tax window.</p>
                  <Button variant="link" className="px-0 h-auto text-primary mt-2 group-hover:translate-x-1 transition-transform">Preview Return →</Button>
                </div>
                <div className="p-4 border rounded-xl hover:bg-accent/5 transition-all cursor-pointer group border-border/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-tighter">General Ledger</span>
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Export full chart of accounts and trial balance.</p>
                  <Button variant="link" className="px-0 h-auto text-primary mt-2 group-hover:translate-x-1 transition-transform">Download CSV →</Button>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/10">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-bold">GL Accounts Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {glSummary?.map(acc => (
                    <div key={acc.id} className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">{acc.name} ({acc.code})</span>
                      <span className="font-mono font-bold">{formatZAR(acc.balance)}</span>
                    </div>
                  ))}
                  {!glSummary && <p className="text-xs text-muted-foreground italic">Loading account balances...</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}