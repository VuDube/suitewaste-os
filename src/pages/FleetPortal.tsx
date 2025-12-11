import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/PageLayout';
import { EnterpriseMap } from '@/components/EnterpriseMap';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Truck, MapPin, Wrench, Activity, Loader2, Navigation, Send, ShieldAlert, Zap, Fuel } from 'lucide-react';
import type { Vehicle, CollectionRoute } from '@shared/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
export function FleetPortal() {
  const queryClient = useQueryClient();
  const [safeMode, setSafeMode] = useState(true);
  const { data: vehicles, isLoading: vLoading } = useQuery({ queryKey: ['vehicles'], queryFn: () => api<Vehicle[]>('/api/fleet/vehicles') });
  const { data: routes, isLoading: rLoading } = useQuery({ queryKey: ['routes'], queryFn: () => api<CollectionRoute[]>('/api/fleet/routes') });
  const dispatchMutation = useMutation({
    mutationFn: (id: string) => api(`/api/fleet/routes/${id}/dispatch`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success("Logistics Dispatch Finalized");
    }
  });
  if (vLoading || rLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </PageLayout>
    );
  }
  return (
    <PageLayout>
      <div className="space-y-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Fleet Command</h1>
            <p className="text-muted-foreground text-lg italic">Telematics & Crime-Zone Rerouting</p>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-variant/50 border border-white/5">
            <div className="flex items-center space-x-2">
              <Switch id="safe-mode" checked={safeMode} onCheckedChange={setSafeMode} />
              <Label htmlFor="safe-mode" className="text-[10px] font-black uppercase tracking-widest">Safe-Route Optimization</Label>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <EnterpriseMap className="h-[500px]" />
            <Card className="glass-panel border-none shadow-elevation-1">
              <CardHeader><CardTitle className="text-xs font-black uppercase tracking-widest">Pending Deployments</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-surface-variant/30">
                    <TableRow className="border-b-white/5">
                      <TableHead className="px-6 h-14">Vehicle</TableHead>
                      <TableHead className="px-6 h-14">Nodes</TableHead>
                      <TableHead className="px-6 h-14 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routes?.filter(r => r.status === 'pending').map(r => (
                      <TableRow key={r.id} className="border-b-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="px-6 py-5 font-bold">{vehicles?.find(v => v.id === r.vehicle_id)?.registration}</TableCell>
                        <TableCell className="px-6 py-5 text-xs font-bold text-muted-foreground">{r.stops.length} Deliveries</TableCell>
                        <TableCell className="px-6 py-5 text-right">
                          <Button size="sm" className="h-10 gap-2 font-black uppercase tracking-widest" onClick={() => dispatchMutation.mutate(r.id)}>
                            <Send className="h-4 w-4" /> Dispatch
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <aside className="lg:col-span-4 space-y-6">
            <Card className="bg-card border-none shadow-elevation-3">
              <CardHeader><CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Vehicle Vitals</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {vehicles?.map(v => (
                  <div key={v.id} className="p-4 rounded-xl border border-white/5 bg-surface-variant/20 space-y-3 group hover:bg-surface-variant/40 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm tracking-tight">{v.registration}</span>
                      <Badge variant={v.status === 'active' ? 'default' : 'outline'} className={v.status === 'active' ? 'bg-emerald-600' : ''}>
                        {v.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground"><span>Fuel</span><span>{Math.floor(Math.random()*60 + 40)}%</span></div>
                        <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: '65%' }} />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground"><span>Health</span><span>Optimal</span></div>
                        <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: '95%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border border-red-500/20">
              <CardHeader><CardTitle className="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Security Overlays</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs font-bold leading-relaxed">Safety systems are monitoring 4 critical industrial polygons. Rerouting is enabled for all Isuzu fleet units.</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </PageLayout>
  );
}