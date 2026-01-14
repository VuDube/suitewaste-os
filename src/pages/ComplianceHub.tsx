import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, FileText, Gavel, Scale, Fingerprint, Download, Loader2, AlertTriangle, BookOpen, UserCheck, Archive, Zap } from 'lucide-react';
import { format } from 'date-fns';
export function ComplianceHub() {
  const { data: sapsLogs, isLoading } = useQuery({
    queryKey: ['saps-607'],
    queryFn: () => api<any[]>('/api/compliance/saps607')
  });
  const eprOffset = 74; // Percentage towards industry target
  const auditVerified = true;
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-5xl font-black uppercase tracking-tighter">Compliance Hub</h1>
            <p className="text-muted-foreground text-lg italic flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              SAPS 607, SAWIC & NEMWA Regulatory Portal
            </p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="h-14 px-8 font-black uppercase tracking-widest gap-2">
                <Download className="h-5 w-5" /> SAWIC Export
             </Button>
             <Button className="h-14 px-8 font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20">
                <FileText className="h-5 w-5" /> SAPS 607 Register
             </Button>
          </div>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
           <Card className="bg-card border-none shadow-elevation-1">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">NEMWA Status</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-black text-emerald-500 tracking-tighter uppercase">Compliant</div></CardContent>
           </Card>
           <Card className="bg-card border-none shadow-elevation-1">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Audit Chain</CardTitle></CardHeader>
              <CardContent>
                 <div className="flex items-center gap-2">
                    <div className={cn("h-3 w-3 rounded-full", auditVerified ? "bg-emerald-500" : "bg-red-500 animate-pulse")} />
                    <div className="text-3xl font-black tracking-tighter">{auditVerified ? 'Verified' : 'Tamper Detected'}</div>
                 </div>
              </CardContent>
           </Card>
           <Card className="bg-primary/5 border border-primary/10 shadow-elevation-1">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-primary tracking-widest">EPR Offset Target</CardTitle></CardHeader>
              <CardContent>
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-black tracking-tighter">{eprOffset}%</span>
                    <Zap className="h-4 w-4 text-primary" />
                 </div>
                 <Progress value={eprOffset} className="h-1.5" />
              </CardContent>
           </Card>
        </div>
        <Tabs defaultValue="saps" className="space-y-8">
          <TabsList className="bg-surface-variant/50 p-1.5 rounded-2xl h-16 flex gap-2">
            <TabsTrigger value="saps" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs flex gap-2"><Gavel className="h-4 w-4" /> SAPS Register</TabsTrigger>
            <TabsTrigger value="archive" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs flex gap-2"><Archive className="h-4 w-4" /> Legal Archive</TabsTrigger>
            <TabsTrigger value="biometric" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs flex gap-2"><Fingerprint className="h-4 w-4" /> Identity Chain</TabsTrigger>
          </TabsList>
          <TabsContent value="saps" className="animate-fade-in">
            <Card className="glass-panel border-none overflow-hidden">
                <CardHeader className="bg-surface-variant/20 border-b border-white/5"><CardTitle className="text-xs font-black uppercase tracking-widest">Second-Hand Goods Digital Log (v1.0.4)</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/30">
                      <TableHead className="px-6 h-14">Transaction Reference</TableHead>
                      <TableHead className="px-6 h-14">Identity Proof</TableHead>
                      <TableHead className="px-6 h-14 text-center">Biometric</TableHead>
                      <TableHead className="px-6 h-14 text-right">Status</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {sapsLogs?.map(log => (
                        <TableRow key={log.id} className="border-b-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="px-6 py-5 font-mono text-xs font-bold text-primary">{log.transaction_id.substring(0, 16)}</TableCell>
                          <TableCell className="px-6 py-5 text-xs font-bold uppercase">{log.supplier_id.substring(0, 12)}</TableCell>
                          <TableCell className="px-6 py-5 text-center"><Fingerprint className="h-4 w-4 mx-auto text-emerald-500" /></TableCell>
                          <TableCell className="px-6 py-5 text-right"><Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px] uppercase">SAPS Verified</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="archive" className="animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[2024, 2023, 2022].map(year => (
                   <Card key={year} className="bg-card/40 border-white/5 p-6 space-y-4 hover:bg-card transition-colors cursor-pointer group">
                      <div className="flex justify-between items-center">
                         <div className="h-10 w-10 rounded-xl bg-surface-variant flex items-center justify-center group-hover:bg-primary/20 transition-colors"><BookOpen className="h-5 w-5 text-primary" /></div>
                         <Badge variant="outline" className="text-[10px] font-black">{year} RECORDS</Badge>
                      </div>
                      <h3 className="font-black uppercase tracking-tighter text-xl">Historical Submissions</h3>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Regulatory Archive • 5-Year Retention Policy</p>
                      <Button variant="ghost" className="w-full h-10 border border-white/5 font-black uppercase tracking-widest text-[9px]">Open Vault</Button>
                   </Card>
                ))}
             </div>
          </TabsContent>
          <TabsContent value="biometric" className="animate-fade-in">
             <Card className="glass-panel border-none p-12 text-center flex flex-col items-center gap-6">
                <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center shadow-elevation-12"><Fingerprint className="h-12 w-12 text-primary animate-pulse" /></div>
                <div className="max-w-md space-y-4">
                   <h2 className="text-3xl font-black uppercase tracking-tighter">Identity Blockchain</h2>
                   <p className="text-muted-foreground text-sm font-bold">Every South African ID verified at the POS is cryptographically hashed and linked to the transaction for absolute non-repudiation in legal audits.</p>
                   <Button className="h-14 px-8 font-black uppercase tracking-widest mt-4">Audit Identity Linkage</Button>
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}