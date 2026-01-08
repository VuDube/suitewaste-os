import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/PageLayout';
import { RouteMap } from '@/components/RouteMap';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Truck, MapPin, Wrench, Activity, Loader2, Navigation, Send } from 'lucide-react';
import type { Vehicle, CollectionRoute } from '@shared/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
export function FleetPortal() {
  const queryClient = useQueryClient();
  const { data: vehicles, isLoading: vLoading } = useQuery({ queryKey: ['vehicles'], queryFn: () => api<Vehicle[]>('/api/fleet/vehicles') });
  const { data: routes, isLoading: rLoading } = useQuery({ queryKey: ['routes'], queryFn: () => api<CollectionRoute[]>('/api/fleet/routes') });
  const dispatchMutation = useMutation({
    mutationFn: (id: string) => api(`/api/fleet/routes/${id}/dispatch`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success("Logistics Dispatch Finalized", { description: "Driver notified via mobile terminal." });
    }
  });
  if (vLoading || rLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </PageLayout>
    );
  }
  const activeRoute = routes?.find(r => r.status === 'in-progress') || routes?.[0];
  return (
    <PageLayout>
      <div className="space-y-10 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-display font-bold tracking-tight">Fleet Command</h1>
            <p className="text-muted-foreground text-lg">Real-time logistics & geospatial monitoring.</p>
          </div>
          <Button variant="outline" className="h-12 gap-2" onClick={() => queryClient.invalidateQueries()}>
            <Activity className="h-4 w-4" /> System Health
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-glow shadow-primary/5 border-primary/10 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                  <Navigation className="h-4 w-4 text-primary" /> Industrial Zone Map
                </CardTitle>
                {activeRoute && <Badge className="bg-emerald-600">LIVE: {activeRoute.status.toUpperCase()}</Badge>}
              </CardHeader>
              <CardContent className="p-0">
                <RouteMap stops={activeRoute?.stops || []} status={activeRoute?.status || 'pending'} />
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-border">
              <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">Pending Dispatch</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto border rounded-xl">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50"><TableHead>Vehicle</TableHead><TableHead>Capacity</TableHead><TableHead>Stops</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {routes?.filter(r => r.status === 'pending').map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="font-bold">{vehicles?.find(v => v.id === r.vehicle_id)?.registration}</TableCell>
                          <TableCell className="text-xs font-mono">{vehicles?.find(v => v.id === r.vehicle_id)?.capacity_kg}kg</TableCell>
                          <TableCell className="text-xs font-bold text-muted-foreground">{r.stops.length} Nodes</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" className="h-9 gap-2 font-bold" onClick={() => dispatchMutation.mutate(r.id)} disabled={dispatchMutation.isPending}>
                              {dispatchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Dispatch
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">Fleet Inventory</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {vehicles?.map(v => (
                  <div key={v.id} className="p-4 rounded-xl border border-border/50 bg-secondary/10 flex items-center justify-between hover:bg-secondary/20 transition-colors cursor-pointer group">
                    <div>
                      <div className="text-sm font-black">{v.registration}</div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">{v.model}</div>
                    </div>
                    <Badge variant={v.status === 'active' ? 'default' : 'outline'} className={v.status === 'active' ? 'bg-emerald-600' : ''}>
                      {v.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/10">
              <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">Efficiency Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground"><span>Utilization</span><span>84%</span></div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: '84%' }} transition={{ duration: 1.5 }} className="h-full bg-primary" /></div>
                </div>
                <div className="pt-4 grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-xl bg-card border border-border/50"><div className="text-lg font-black text-primary">12.4t</div><div className="text-[10px] font-bold text-muted-foreground uppercase">Diverted</div></div>
                  <div className="text-center p-3 rounded-xl bg-card border border-border/50"><div className="text-lg font-black text-primary">0</div><div className="text-[10px] font-bold text-muted-foreground uppercase">Incidents</div></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}