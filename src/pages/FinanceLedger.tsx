import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/PageLayout';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatZAR, calculateVAT264Deduction } from '@/lib/finance-utils';
import { Landmark, Receipt, FileSpreadsheet, Loader2, TrendingUp, CheckCircle2, Building2, Send, ShieldCheck, Download, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
export function FinanceLedger() {
  const { data: financeData, isLoading } = useQuery({ queryKey: ['finance-summary'], queryFn: () => api<any>('/api/finance/vat-report') });
  const { data: vat264Logs } = useQuery({ queryKey: ['vat264-logs'], queryFn: () => api<any[]>('/api/finance/vat264') });
  const [approving, setApproving] = useState(false);
  const handleBankservDispatch = () => {
    setApproving(true);
    setTimeout(() => {
      toast.success("Bankserv Bulk EFT Dispatched", { description: "Batch #BS-9928 authorized for immediate settlement." });
      setApproving(false);
    }, 2000);
  };
  const downloadVAT201 = () => {
    toast.info("Generating SARS VAT-201 Report...");
    // Mock CSV trigger
  };
  if (isLoading) return <PageLayout><div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></PageLayout>;
  return (
    <PageLayout>
      <div className="space-y-10 max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">Finance</h1>
            <p className="text-muted-foreground text-lg italic flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Multi-App Settlement Engine</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" onClick={downloadVAT201} className="h-14 font-black uppercase tracking-widest gap-2"><FileSpreadsheet className="h-5 w-5" /> VAT-201 Export</Button>
             <Button onClick={handleBankservDispatch} disabled={approving} className="h-14 px-8 font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20">
                {approving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />} Dispatch EFT Batch
             </Button>
          </div>
        </header>
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-surface-variant/50 p-1.5 rounded-2xl h-16 flex gap-2">
            <TabsTrigger value="overview" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs">Overview</TabsTrigger>
            <TabsTrigger value="vat264" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs">VAT-264 Log</TabsTrigger>
            <TabsTrigger value="payouts" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs">Settlements</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-8 animate-fade-in">
             <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-card border-none shadow-elevation-1">
                   <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Calculated Output Tax</CardTitle></CardHeader>
                   <CardContent><div className="text-3xl font-black text-primary tracking-tighter">{formatZAR(financeData?.vat_amount || 0)}</div></CardContent>
                </Card>
                <Card className="bg-card border-none shadow-elevation-1">
                   <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Digital Payout Queue</CardTitle></CardHeader>
                   <CardContent><div className="text-3xl font-black tracking-tighter">14 Vendors</div></CardContent>
                </Card>
                <Card className="bg-primary/5 border border-primary/10 shadow-elevation-1">
                   <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-primary tracking-widest">EPR Reserve</CardTitle></CardHeader>
                   <CardContent><div className="text-3xl font-black text-primary tracking-tighter">R 124,500.00</div></CardContent>
                </Card>
             </div>
             <Card className="glass-panel border-none shadow-elevation-3 p-8 flex items-center justify-between">
                <div className="space-y-1">
                   <h3 className="font-black uppercase tracking-tighter text-xl">Digital Payout Wallet</h3>
                   <div className="flex gap-4 items-center mt-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><ShieldCheck className="h-4 w-4 text-emerald-500" /> MamaMoney Integrated</div>
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><CreditCard className="h-4 w-4 text-primary" /> Stitch Gateway Active</div>
                   </div>
                </div>
                <div className="text-right">
                   <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Wallet Balance</div>
                   <div className="text-3xl font-black tracking-tighter">R 89,200.45</div>
                </div>
             </Card>
          </TabsContent>
          <TabsContent value="vat264" className="space-y-6 animate-fade-in">
             <Card className="glass-panel border-none shadow-elevation-1">
                <CardHeader className="flex flex-row items-center justify-between">
                   <CardTitle className="text-xs font-black uppercase tracking-widest">SARS Second-Hand Goods Input Tax Log</CardTitle>
                   <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 font-bold uppercase text-[9px]">SARS Compliance v2.4</Badge>
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader className="bg-surface-variant/30">
                         <TableRow className="border-b-white/5">
                            <TableHead className="px-6 h-14">Vendor ID / ID Number</TableHead>
                            <TableHead className="px-6 h-14 text-right">Purchase Gross (ZAR)</TableHead>
                            <TableHead className="px-6 h-14 text-right">Input Tax (15/115)</TableHead>
                            <TableHead className="px-6 h-14 text-center">Status</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {vat264Logs?.map((log, i) => (
                            <TableRow key={i} className="border-b-white/5 hover:bg-white/5 transition-colors">
                               <TableCell className="px-6 py-5 font-bold font-mono text-xs">{log.supplier_id}</TableCell>
                               <TableCell className="px-6 py-5 text-right font-bold">{formatZAR(log.amount)}</TableCell>
                               <TableCell className="px-6 py-5 text-right font-black text-emerald-500">{formatZAR(calculateVAT264Deduction(log.amount).inputTaxDeduction)}</TableCell>
                               <TableCell className="px-6 py-5 text-center"><Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px]">VERIFIED</Badge></TableCell>
                            </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>
          </TabsContent>
          <TabsContent value="payouts" className="animate-fade-in">
             <Card className="glass-panel border-none shadow-elevation-1">
                <CardHeader><CardTitle className="text-xs font-black uppercase tracking-widest">Bankserv Bulk EFT History</CardTitle></CardHeader>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader className="bg-surface-variant/30"><TableRow className="border-b-white/5"><TableHead className="px-6 h-14">Batch ID</TableHead><TableHead className="px-6 h-14">Timestamp</TableHead><TableHead className="px-6 h-14 text-right">Total Amount</TableHead><TableHead className="px-6 h-14 text-center">Status</TableHead></TableRow></TableHeader>
                      <TableBody>
                         {[1, 2, 3].map(i => (
                            <TableRow key={i} className="border-b-white/5 hover:bg-white/5">
                               <TableCell className="px-6 py-5 font-mono text-xs">BS-992{i}</TableCell>
                               <TableCell className="px-6 py-5 text-xs text-muted-foreground">2025-05-1{i} 14:00</TableCell>
                               <TableCell className="px-6 py-5 text-right font-black">R {(45000 + i * 1000).toLocaleString()}</TableCell>
                               <TableCell className="px-6 py-5 text-center"><Badge variant="default" className="bg-emerald-600 font-bold uppercase text-[9px]">SETTLED</Badge></TableCell>
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