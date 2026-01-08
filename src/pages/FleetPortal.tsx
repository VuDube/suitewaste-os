import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/PageLayout';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Truck, MapPin, Wrench, Activity, Loader2, Navigation } from 'lucide-react';
import type { Vehicle, CollectionRoute } from '@shared/types';
import { motion } from 'framer-motion';
export function FleetPortal() {
  const { data: vehicles, isLoading: vLoading } = useQuery({ queryKey: ['vehicles'], queryFn: () => api<Vehicle[]>('/api/fleet/vehicles') });
  const { data: routes, isLoading: rLoading } = useQuery({ queryKey: ['routes'], queryFn: () => api<CollectionRoute[]>('/api/fleet/routes') });
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
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight">Fleet Command</h1>
          <p className="text-muted-foreground text-lg">Logistics & route optimization engine.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {vehicles?.map((v, i) => (
            <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-card/40 border-primary/5 hover:border-primary/20 transition-all group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/20">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant={v.status === 'active' ? 'default' : 'secondary'} className={v.status === 'active' ? 'bg-emerald-600' : ''}>
                    {v.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold font-mono">{v.registration}</div>
                  <p className="text-xs text-muted-foreground uppercase font-bold mt-1 flex items-center gap-2">
                    {v.model}
                    {v.status === 'maintenance' && <Wrench className="h-3 w-3 text-orange-500" />}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs font-bold">
                    <span>CAPACITY:</span>
                    <span className="text-primary">{v.capacity_kg}kg</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 shadow-soft bg-card/60 backdrop-blur-sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><Navigation className="h-5 w-5 text-primary" /> Live Daily Routes</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto border rounded-xl">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Route ID</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Stops</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routes?.length ? routes.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.id.substring(0, 8)}</TableCell>
                        <TableCell className="font-bold">{vehicles?.find(v => v.id === r.vehicle_id)?.registration}</TableCell>
                        <TableCell>
                          <div className="flex -space-x-1">
                            {r.stops.map((s, i) => (
                              <div key={i} className="h-6 w-6 rounded-full bg-accent border-2 border-background flex items-center justify-center text-[10px] font-bold">
                                {i + 1}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase text-[10px]">{r.status}</Badge>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">No routes dispatched today.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/40 border-border">
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Operational Health</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Fleet Utilization</div>
                <div className="text-2xl font-bold">84%</div>
              </div>
              <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Maintenance Alerts</div>
                <div className="text-2xl font-bold text-orange-500">
                  {vehicles?.filter(v => v.status === 'maintenance').length || 0} Vehicles
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}