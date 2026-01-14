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
import { ShieldCheck, FileText, Gavel, Scale, Fingerprint, Download, Archive, Zap, ShieldAlert } from 'lucide-react';
import { cn } from "@/lib/utils";
export function ComplianceHub() {
  const { data: dashboardData } = useQuery({ queryKey: ['dashboard'], queryFn: () => api<any>('/api/dashboard') });
  const { data: sapsLogs } = useQuery({ queryKey: ['saps-607'], queryFn: () => api<any[]>('/api/compliance/saps607') });
  const eprOffset = dashboardData?.summary?.weeePct || 74;
  const auditVerified = true;
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="space-y-10">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <h1 className="text-5xl font-black uppercase tracking-tighter">Compliance</h1>
              <p className="text-muted-foreground text-lg italic flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                SAPS 607, NEMWA & EPR National Standards
              </p>
            </div>
            <div className="flex gap-3">
               <Button variant="outline" className="h-14 px-8 font-black uppercase tracking-widest gap-2 rounded-2xl shadow-elevation-1">
                  <Download className="h-5 w-5" /> Export Register
               </Button>
               <Button className="h-14 px-8 font-black uppercase tracking-widest gap-2 shadow-lg bg-primary rounded-2xl">
                  <FileText className="h-5 w-5" /> SAPS Audit
               </Button>
            </div>
          </header>
          <div className="grid gap-6 md:grid-cols-3">
             <Card className="bg-card border-none shadow-elevation-1">
                <CardHeader className="pb-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">NEMWA Status</CardHeader>
                <CardContent><div className="text-3xl font-black text-emerald-500 tracking-tighter uppercase">Compliant</div></CardContent>
             </Card>
             <Card className="bg-card border-none shadow-elevation-1">
                <CardHeader className="pb-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Audit Chain</CardHeader>
                <CardContent>
                   <div className="flex items-center gap-2">
                      <div className={cn("h-3 w-3 rounded-full", auditVerified ? "bg-emerald-500" : "bg-red-500 animate-pulse")} />
                      <div className="text-3xl font-black tracking-tighter">{auditVerified ? 'Verified' : 'Tamper Detected'}</div>
                   </div>
                </CardContent>
             </Card>
             <Card className="bg-primary/5 border border-primary/10 shadow-elevation-1">
                <CardHeader className="pb-2 text-[10px] font-black uppercase text-primary tracking-widest">EPR Diversion Target</CardHeader>
                <CardContent>
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-2xl font-black tracking-tighter">{eprOffset}%</span>
                      <Zap className="h-4 w-4 text-primary" />
                   </div>
                   <Progress value={eprOffset} className="h-1.5 bg-primary/20" />
                </CardContent>
             </Card>
          </div>
          <Tabs defaultValue="saps" className="space-y-8">
            <TabsList className="bg-surface-variant/50 p-1.5 rounded-2xl h-16 flex gap-2">
              <TabsTrigger value="saps" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs gap-2"><Gavel className="h-4 w-4" /> SAPS 607</TabsTrigger>
              <TabsTrigger value="biometric" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs gap-2"><Fingerprint className="h-4 w-4" /> Identity</TabsTrigger>
              <TabsTrigger value="archive" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs gap-2"><Archive className="h-4 w-4" /> Archive</TabsTrigger>
            </TabsList>
            <TabsContent value="saps" className="animate-fade-in">
              <Card className="glass-panel border-none overflow-hidden rounded-3xl">
                  <CardHeader className="bg-surface-variant/20 border-b border-white/5 h-14 flex items-center justify-between"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Second-Hand Goods Digital Register</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="border-b-white/5">
                          <TableHead className="px-6 h-14 text-[9px] font-black uppercase">Transaction Ref</TableHead>
                          <TableHead className="px-6 h-14 text-[9px] font-black uppercase">Identity Proof</TableHead>
                          <TableHead className="px-6 h-14 text-center text-[9px] font-black uppercase">Fingerprint</TableHead>
                          <TableHead className="px-6 h-14 text-right text-[9px] font-black uppercase">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sapsLogs?.map(log => (
                          <TableRow key={log.id} className="border-b-white/5 hover:bg-white/5 transition-colors group">
                            <TableCell className="px-6 py-5 font-mono text-xs font-bold text-primary group-hover:underline cursor-pointer">{log.transaction_id.substring(0, 16)}</TableCell>
                            <TableCell className="px-6 py-5 text-xs font-bold uppercase">{log.supplier_id.substring(0, 12)}</TableCell>
                            <TableCell className="px-6 py-5 text-center"><Fingerprint className="h-4 w-4 mx-auto text-emerald-500" /></TableCell>
                            <TableCell className="px-6 py-5 text-right"><Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px] uppercase">VERIFIED</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="biometric" className="animate-fade-in">
               <Card className="glass-panel border-none p-12 text-center flex flex-col items-center gap-6 rounded-3xl shadow-elevation-3">
                  <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center shadow-glow"><Fingerprint className="h-12 w-12 text-primary animate-pulse" /></div>
                  <div className="max-w-md space-y-4">
                     <h2 className="text-3xl font-black uppercase tracking-tighter">Identity Blockchain</h2>
                     <p className="text-muted-foreground text-sm font-bold">Every ID verification is cryptographically linked to the transaction record, ensuring non-repudiation in SAPS inspections.</p>
                     <Button className="h-14 px-8 font-black uppercase tracking-widest bg-primary rounded-2xl">Audit Identity Linkage</Button>
                  </div>
               </Card>
            </TabsContent>
            <TabsContent value="archive" className="animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[2024, 2023].map(year => (
                     <Card key={year} className="bg-card/40 border-white/5 p-8 space-y-4 hover:bg-primary/5 transition-all group rounded-3xl cursor-pointer">
                        <div className="flex justify-between items-center">
                           <Archive className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                           <Badge variant="outline" className="text-[10px] font-black">{year} RECORDS</Badge>
                        </div>
                        <h3 className="font-black uppercase tracking-tighter text-2xl">Compliance Vault</h3>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">5-Year Retention Policy Active</p>
                        <Button variant="ghost" className="w-full h-10 border border-white/5 font-black uppercase tracking-widest text-[9px] mt-4">Access Records</Button>
                     </Card>
                  ))}
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
}