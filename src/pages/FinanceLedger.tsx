import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/PageLayout';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatZAR } from '@/lib/finance-utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Landmark, Receipt, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
export function FinanceLedger() {
  const { data: financeData, isLoading } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => api<any>('/api/finance/vat-report')
  });
  const chartData = [
    { name: 'Net', val: financeData?.net_amount || 0 },
    { name: 'VAT', val: financeData?.vat_amount || 0 },
    { name: 'Gross', val: financeData?.gross_amount || 0 },
  ];
  const handleSARSExport = () => {
    toast.success("SARS VAT201 Report Exported", {
      description: "Submission file generated for 2024-H1 period."
    });
  };
  return (
    <PageLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Finance Ledger</h1>
            <p className="text-muted-foreground italic">SARS VAT-201 Compliance Framework</p>
          </div>
          <Button onClick={handleSARSExport} className="h-12 gap-2 shadow-primary/20 shadow-lg">
            <Download className="h-4 w-4" /> Export for SARS
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Total Output VAT</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{formatZAR(financeData?.vat_amount || 0)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Total Net Sales</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatZAR(financeData?.net_amount || 0)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Liability Accrual</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{formatZAR(financeData?.vat_amount || 0)}</div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5" /> Financial Distribution</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => `R${v/1000}k`} />
                  <Tooltip formatter={(v: number) => formatZAR(v)} />
                  <Bar dataKey="val" fill="#38761d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Quick Audit</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase">VAT-201</span>
                  <Badge variant="outline" className="text-[10px]">CURRENT</Badge>
                </div>
                <p className="text-sm">Consolidated report for current tax window.</p>
                <Button variant="link" className="px-0 h-auto text-primary mt-2 group-hover:underline">View Preview</Button>
              </div>
              <div className="p-4 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase">General Ledger</span>
                  <FileSpreadsheet className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="text-sm">Trial balance and accounts summary.</p>
                <Button variant="link" className="px-0 h-auto text-primary mt-2 group-hover:underline">Export CSV</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}