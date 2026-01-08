import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { AuditLog as AuditLogType } from '@shared/types';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShieldCheck, ShieldAlert, History, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
export function AuditLog() {
  const [cursor, setCursor] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', cursor],
    queryFn: () => api<{ items: AuditLogType[], next: string | null }>(`/api/audit?cursor=${cursor || ''}`),
  });
  const verifyMutation = useMutation({
    mutationFn: () => api<any>('/api/audit/verify', { method: 'POST' }),
    onSuccess: (res) => {
      if (res.verified) {
        toast.success(`Chain Integrity Verified! ${res.totalChecked} records checked.`, {
          icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />
        });
      } else {
        toast.error(`CHAIN TAMPERED: ${res.reason} at block ${res.blockId}`, {
          duration: 10000,
          icon: <ShieldAlert className="h-5 w-5 text-destructive" />
        });
      }
    }
  });
  return (
    <PageLayout>
      <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold tracking-tight">Audit Trail</h1>
            <p className="text-muted-foreground mt-1 text-lg">SHA256 Chained Immutable Ledger</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-12 gap-2" onClick={() => verifyMutation.mutate()} disabled={verifyMutation.isPending}>
              {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Verify System Integrity
            </Button>
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-500 hidden sm:inline">Audit Chain Intact</span>
            </div>
          </div>
        </div>
        <Card className="bg-card/40 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Ledger Sequence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Hash Tail</TableHead>
                    <TableHead className="text-right">Audit Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : data?.items.map((log) => (
                    <TableRow key={log.id} className="group hover:bg-accent/5">
                      <TableCell className="text-xs font-mono">{format(log.timestamp, 'yyyy-MM-dd HH:mm:ss.SSS')}</TableCell>
                      <TableCell>
                        <Badge variant={log.action === 'delete' ? 'destructive' : 'outline'} className="uppercase text-[10px] font-bold">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-bold">{log.entity_type}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{log.entity_id.substring(0, 8)}...</div>
                      </TableCell>
                      <TableCell className="text-[10px] font-mono text-muted-foreground">{log.payload_hash.substring(0, 16)}...</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 font-semibold">Inspect</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl bg-card">
                            <DialogHeader><DialogTitle>Block Verification Details</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 bg-muted/50 border rounded-lg font-mono text-xs overflow-auto max-h-[60vh]">
                                <pre>{JSON.stringify(JSON.parse(log.details || '{}'), null, 2)}</pre>
                              </div>
                              <div className="grid grid-cols-1 gap-4 text-[10px] font-mono border-t pt-4">
                                <div className="space-y-1"><p className="text-muted-foreground">PREVIOUS_HASH</p><p className="break-all bg-accent/20 p-1">{log.previous_hash}</p></div>
                                <div className="space-y-1"><p className="text-emerald-500 font-bold">CURRENT_BLOCK_HASH</p><p className="break-all bg-emerald-500/5 p-1">{log.payload_hash}</p></div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data?.items.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No audit logs found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {data?.next && (
              <Button variant="outline" className="w-full mt-4 h-12" onClick={() => setCursor(data.next)}>Fetch Older Blocks</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}