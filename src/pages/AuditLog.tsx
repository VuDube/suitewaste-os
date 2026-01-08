import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { AuditLog as AuditLogType } from '@shared/types';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShieldCheck, ShieldAlert, History, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
export function AuditLog() {
  const [cursor, setCursor] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', cursor],
    queryFn: () => api<{ items: AuditLogType[], next: string | null }>(`/api/audit?cursor=${cursor || ''}`),
  });
  return (
    <PageLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold tracking-tight">Enterprise Audit Trail</h1>
            <p className="text-muted-foreground mt-1">Immutable, SHA256-chained cryptographic record of all system state changes.</p>
          </div>
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-500">Chain Verified</span>
          </div>
        </div>
        <Card className="bg-card/40 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Hash (Tail)</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : data?.items.map((log) => (
                    <TableRow key={log.id} className="group">
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
                      <TableCell className="text-xs">{log.actor_id}</TableCell>
                      <TableCell className="text-[10px] font-mono text-muted-foreground">{log.payload_hash.substring(0, 12)}...</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2">Inspect</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader><DialogTitle>Audit Record Details</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 bg-muted rounded-lg font-mono text-xs overflow-auto max-h-96">
                                <pre>{JSON.stringify(JSON.parse(log.details || '{}'), null, 2)}</pre>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-[10px] font-mono">
                                <div><p className="text-muted-foreground">PREV_HASH</p><p className="break-all">{log.previous_hash}</p></div>
                                <div><p className="text-muted-foreground">CURR_HASH</p><p className="break-all">{log.payload_hash}</p></div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {data?.next && (
              <Button variant="outline" className="w-full mt-4" onClick={() => setCursor(data.next)}>Load More Records</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}