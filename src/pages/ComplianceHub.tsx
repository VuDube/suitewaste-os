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
import { ShieldCheck, FileText, Gavel, Scale, Fingerprint, Download, Loader2, AlertTriangle, BookOpen, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
export function ComplianceHub() {
  const { data: sapsLogs, isLoading } = useQuery({
    queryKey: ['saps-607'],
    queryFn: () => api<any[]>('/api/compliance/saps607')
  });
  const riskScore = 88;
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-5xl font-black uppercase tracking-tighter">Compliance</h1>
            <p className="text-muted-foreground text-lg italic flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Second-Hand Goods Act Framework (SAPS 607)
            </p>
          </div>
          <Button className="h-14 px-8 font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20">
            <Download className="h-5 w-5" /> SAPS 607 Export
          </Button>
        </header>
        <Tabs defaultValue="register" className="space-y-8">
          <TabsList className="bg-surface-variant/50 p-1.5 rounded-2xl h-16 flex gap-2">
            <TabsTrigger value="register" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs flex gap-2">
              <BookOpen className="h-4 w-4" /> Industrial Register
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs flex gap-2">
              <UserCheck className="h-4 w-4" /> ID Verification
            </TabsTrigger>
          </TabsList>
          <TabsContent value="register">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 glass-panel border-none overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-surface-variant/20">
                  <CardTitle className="text-xs font-black uppercase tracking-widest">Digital Registry Sequence</CardTitle>
                  <Badge variant="outline" className="border-primary/20 text-primary">IMMUTABLE</Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-[10px] font-black uppercase px-6">Trx ID</TableHead>
                          <TableHead className="text-[10px] font-black uppercase px-6">Status</TableHead>
                          <TableHead className="text-[10px] font-black uppercase px-6">Biometric</TableHead>
                          <TableHead className="text-[10px] font-black uppercase px-6 text-right">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                        ) : sapsLogs?.map(log => (
                          <TableRow key={log.id} className="hover:bg-white/5 transition-colors border-b-white/5">
                            <TableCell className="px-6 py-5 font-mono text-xs font-bold">{log.transaction_id.substring(0, 12)}</TableCell>
                            <TableCell className="px-6 py-5">
                              <Badge variant={log.status === 'verified' ? 'default' : 'secondary'} className={log.status === 'verified' ? 'bg-emerald-600 font-bold' : 'font-bold'}>
                                {log.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-5"><Fingerprint className="h-5 w-5 text-primary" /></TableCell>
                            <TableCell className="px-6 py-5 text-right text-[10px] font-black uppercase text-muted-foreground">{format(log.created_at, 'yyyy-MM-dd')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              <section className="space-y-6">
                <Card className="bg-card border-none shadow-elevation-12 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><Gavel className="h-24 w-24" /></div>
                  <CardHeader><CardTitle className="text-xs font-black uppercase tracking-widest">Audit Chain integrity</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex justify-between items-end">
                      <span className="text-5xl font-black text-primary">{riskScore}%</span>
                      <span className="text-xs font-bold uppercase text-muted-foreground">Compliance Score</span>
                    </div>
                    <Progress value={riskScore} className="h-3" />
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500"><ShieldCheck className="h-4 w-4" /> SHA256 Chaining Verified</div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-orange-500"><AlertTriangle className="h-4 w-4" /> Missing Supplier KYB Docs</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-primary shadow-lg border-none text-primary-foreground relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                  <CardHeader><CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Scale className="h-4 w-4" /> Legal Authority</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm font-bold opacity-80 mb-6">Direct dispatch line for industrial compliance verification.</p>
                    <Button variant="secondary" className="w-full h-14 font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-transform">
                      Call Station Officer
                    </Button>
                  </CardContent>
                </Card>
              </section>
            </div>
          </TabsContent>
          <TabsContent value="verification">
            <Card className="glass-panel border-none h-[400px] flex items-center justify-center text-center p-12">
               <div className="max-w-md space-y-4">
                  <Fingerprint className="h-16 w-16 mx-auto text-primary animate-pulse" />
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Biometric Gateway</h3>
                  <p className="text-muted-foreground text-sm font-bold">Secure ID verification via hardware peripheral. Scanning of fingerprints or ID cards is required for all cash-equivalent transactions.</p>
                  <Button className="h-14 px-8 font-black uppercase tracking-widest mt-4">Initialize Scanner</Button>
               </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}