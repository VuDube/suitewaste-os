import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, FileText, Gavel, Scale, Fingerprint, Download, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
export function ComplianceHub() {
  const { data: sapsLogs, isLoading } = useQuery({
    queryKey: ['saps-607'],
    queryFn: () => api<any[]>('/api/compliance/saps607')
  });
  const riskScore = 88; // Industrial Mock Score
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-5xl font-black uppercase tracking-tighter">Compliance Hub</h1>
            <p className="text-muted-foreground text-lg italic">Legal framework for SAPS 607 & Second-Hand Goods Act.</p>
          </div>
          <Button className="h-14 px-8 font-black uppercase tracking-widest gap-2">
            <Download className="h-5 w-5" /> Export Police PDF
          </Button>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 glass-panel border-none">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-surface-variant/20">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                <FileText className="h-4 w-4 text-primary" /> SAPS 607 Register
              </CardTitle>
              <Badge variant="outline" className="border-primary/20 text-primary">LIVE LEDGER</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Transaction</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Biometrics</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                    ) : sapsLogs?.map(log => (
                      <TableRow key={log.id} className="hover:bg-white/5 transition-colors">
                        <TableCell className="font-mono text-xs">{log.transaction_id.substring(0, 12)}...</TableCell>
                        <TableCell>
                          <Badge variant={log.status === 'verified' ? 'default' : 'secondary'} className={log.status === 'verified' ? 'bg-emerald-600' : ''}>
                            {log.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell><Fingerprint className="h-4 w-4 text-muted-foreground" /></TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{format(log.created_at, 'yyyy-MM-dd')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <section className="space-y-6">
            <Card className="bg-card border-none shadow-elevation-12">
              <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Gavel className="h-4 w-4" /> Legal Risk Analysis</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-4xl font-black text-primary">{riskScore}%</span>
                  <span className="text-xs font-bold uppercase text-muted-foreground">Audit Health</span>
                </div>
                <Progress value={riskScore} className="h-3" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-500"><ShieldCheck className="h-4 w-4" /> SHA256 Chain Verified</div>
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-500"><AlertTriangle className="h-4 w-4" /> 4 Missing Supplier ID Docs</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary shadow-lg border-none text-primary-foreground">
              <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Scale className="h-4 w-4" /> Legal Contacts</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm font-medium opacity-80 mb-4">Immediate access to station-bound compliance officers.</p>
                <Button variant="secondary" className="w-full h-12 font-black uppercase tracking-widest rounded-xl">Call Compliance Lead</Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}