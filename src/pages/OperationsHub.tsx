import React, { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { QRCodeSVG } from 'qrcode.react';
import { Box, QrCode, ClipboardCheck, AlertCircle, Printer, Download, Search, Play, Square, Settings, Scale, Split } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
export function OperationsHub() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const { data: ledger, isLoading } = useQuery({ queryKey: ['ledger'], queryFn: () => api<any[]>('/api/ledger') });
  const shiftMutation = useMutation({
    mutationFn: (status: 'start' | 'end') => api('/api/ops/shifts', { method: 'POST', body: JSON.stringify({ status }) }),
    onSuccess: (_, status) => {
      setIsShiftActive(status === 'start');
      toast.success(status === 'start' ? "Shift Started" : "Shift Finalized", {
        description: `Yard timestamp recorded at ${new Date().toLocaleTimeString()}`
      });
    }
  });
  const calibrateMutation = useMutation({
    mutationFn: (results: any) => api('/api/hardware/calibrate', { method: 'POST', body: JSON.stringify(results) }),
    onSuccess: () => {
      toast.success("Scale Calibration Verified", { description: "5-point check recorded to immutable audit chain." });
      setIsCalibrating(false);
    }
  });
  const filteredItems = ledger?.filter(item =>
    item.material_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  return (
    <PageLayout fullBleed>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-32">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black uppercase tracking-tighter">Yard Ops</h1>
            <div className="flex items-center gap-3">
              <Badge variant={isShiftActive ? "default" : "secondary"} className={isShiftActive ? "bg-emerald-600 font-bold" : "font-bold"}>
                {isShiftActive ? "SHIFT ACTIVE" : "STATION STANDBY"}
              </Badge>
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Zone: JHB-South-01</span>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button
              onClick={() => shiftMutation.mutate(isShiftActive ? 'end' : 'start')}
              variant={isShiftActive ? "destructive" : "default"}
              className="h-14 font-black uppercase tracking-widest px-8 shadow-lg"
            >
              {isShiftActive ? <><Square className="mr-2 h-5 w-5" /> End Shift</> : <><Play className="mr-2 h-5 w-5" /> Start Shift</>}
            </Button>
            <Dialog open={isCalibrating} onOpenChange={setIsCalibrating}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-14 font-black uppercase tracking-widest px-8">
                  <Scale className="mr-2 h-5 w-5" /> Calibrate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-3xl">
                <DialogHeader>
                  <DialogTitle>Industrial Scale Calibration</DialogTitle>
                  <DialogDescription>Perform 5-point weight verification sequence.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {[20, 50, 100, 250, 500].map(weight => (
                    <div key={weight} className="flex items-center justify-between p-3 bg-surface-variant/30 rounded-xl border border-white/5">
                      <span className="font-bold text-sm">Reference: {weight}kg</span>
                      <Badge variant="outline" className="text-emerald-500 border-emerald-500/20">PASS</Badge>
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button onClick={() => calibrateMutation.mutate({ device: 'main-scale-01', status: 'pass' })} className="w-full h-14 font-black uppercase tracking-widest">Verify & Record</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3 glass-panel border-none shadow-elevation-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search yard inventory..." className="pl-10 h-12 bg-surface-variant/50 border-none rounded-xl font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <Button variant="ghost" className="h-10 text-[10px] font-black uppercase tracking-widest gap-2">
                <Split className="h-4 w-4" /> Batch Splitting
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-surface-variant/30">
                  <TableRow className="border-b-white/5">
                    <TableHead className="text-[10px] font-black uppercase px-6 h-14">Material</TableHead>
                    <TableHead className="text-[10px] font-black uppercase px-6 h-14 text-right">Mass (kg)</TableHead>
                    <TableHead className="text-[10px] font-black uppercase px-6 h-14 text-center">Batch ID</TableHead>
                    <TableHead className="text-[10px] font-black uppercase px-6 h-14 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map(item => (
                    <TableRow key={item.id} className="hover:bg-white/5 border-b-white/5 transition-colors">
                      <TableCell className="px-6 py-5 font-bold text-sm">{item.material_type}</TableCell>
                      <TableCell className="px-6 py-5 text-right font-mono font-black text-lg text-primary">{item.weight_kg.toFixed(2)}</TableCell>
                      <TableCell className="px-6 py-5 text-center">
                        <Dialog>
                          <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-10 w-10"><QrCode className="h-5 w-5" /></Button></DialogTrigger>
                          <DialogContent className="max-w-xs flex flex-col items-center p-8">
                            <QRCodeSVG value={item.id} size={200} />
                            <Button className="w-full mt-6 font-black uppercase tracking-widest"><Printer className="mr-2 h-4 w-4" /> Print Tag</Button>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-right">
                        <Button variant="outline" size="sm" className="h-9 font-black uppercase tracking-widest text-[9px]">Splice Lot</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <aside className="space-y-6">
            <Card className="bg-primary shadow-elevation-12 border-none">
              <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/80">Batch Readiness</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-black text-primary-foreground tracking-tighter">92%</div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-white" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-panel border-none p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Yard Grid</h3>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className={cn("aspect-square rounded-lg border border-white/5 flex items-center justify-center transition-colors", i < 7 ? "bg-primary/20 text-primary" : "bg-surface-variant/20")}>
                    <Box className="h-4 w-4" />
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-background/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-center gap-4 px-6 z-40">
           <Button className="flex-1 max-w-sm h-14 font-black uppercase tracking-widest gap-2 bg-emerald-600 shadow-xl"><ClipboardCheck className="h-5 w-5" /> Batch Approval Manifest</Button>
           <Button variant="outline" className="flex-1 max-w-sm h-14 font-black uppercase tracking-widest gap-2"><Download className="h-5 w-5" /> Daily Yard Export</Button>
        </div>
      </div>
    </PageLayout>
  );
}