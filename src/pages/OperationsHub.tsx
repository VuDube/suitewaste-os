import React, { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { QRCodeSVG } from 'qrcode.react';
import { Box, QrCode, ClipboardCheck, AlertCircle, Printer, Download, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
export function OperationsHub() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: ledger, isLoading } = useQuery({ queryKey: ['ledger'], queryFn: () => api<any[]>('/api/ledger') });
  const handleBulkStamp = (status: 'Approved' | 'Flagged') => {
    toast.success(`Batch successfully ${status.toLowerCase()}`, {
      description: "Inventory manifest updated across all nodes."
    });
  };
  const filteredItems = ledger?.filter(item => 
    item.material_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black uppercase tracking-tighter">Operations</h1>
            <p className="text-muted-foreground text-lg italic">Yard Batching & QR Manifest Logic</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button onClick={() => handleBulkStamp('Approved')} className="flex-1 md:flex-none h-14 bg-emerald-600 hover:bg-emerald-700 font-bold uppercase tracking-widest gap-2">
              <ClipboardCheck className="h-5 w-5" /> Batch Approve
            </Button>
            <Button onClick={() => handleBulkStamp('Flagged')} variant="destructive" className="flex-1 md:flex-none h-14 font-bold uppercase tracking-widest gap-2">
              <AlertCircle className="h-5 w-5" /> Flag Audit
            </Button>
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3 glass-panel border-none shadow-elevation-1">
            <CardHeader className="flex flex-row items-center justify-between pb-6">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search batches..." 
                  className="pl-10 h-12 bg-surface-variant/50 border-none rounded-xl font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Badge variant="secondary" className="font-black uppercase tracking-widest px-4">{filteredItems.length} Active Lots</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-surface-variant/30">
                    <TableRow className="border-b-white/5">
                      <TableHead className="text-[10px] font-black uppercase px-6 h-14">Material Batch</TableHead>
                      <TableHead className="text-[10px] font-black uppercase px-6 h-14 text-right">Net Mass (kg)</TableHead>
                      <TableHead className="text-[10px] font-black uppercase px-6 h-14 text-center">QR Identity</TableHead>
                      <TableHead className="text-[10px] font-black uppercase px-6 h-14 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}><TableCell colSpan={4} className="p-6 text-center italic text-muted-foreground animate-pulse">Scanning yard storage...</TableCell></TableRow>
                      ))
                    ) : filteredItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-white/5 border-b-white/5 transition-colors">
                        <TableCell className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Box className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-bold text-sm">{item.material_type}</div>
                              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">ID: {item.id.substring(0, 12)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5 text-right font-mono font-black text-lg text-primary">{item.weight_kg.toFixed(2)}</TableCell>
                        <TableCell className="px-6 py-5 text-center">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/20 transition-colors">
                                <QrCode className="h-5 w-5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xs flex flex-col items-center justify-center p-8 space-y-6">
                              <DialogHeader className="text-center">
                                <DialogTitle className="text-xl font-black uppercase tracking-tighter">Batch Manifest QR</DialogTitle>
                              </DialogHeader>
                              <div className="p-4 bg-white rounded-2xl shadow-xl">
                                <QRCodeSVG value={item.id} size={200} level="H" includeMargin />
                              </div>
                              <Button className="w-full h-14 font-black uppercase tracking-widest gap-2">
                                <Printer className="h-5 w-5" /> Print Tag
                              </Button>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell className="px-6 py-5 text-right">
                          <Button variant="outline" size="sm" className="h-10 font-black uppercase tracking-widest">Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <aside className="space-y-6">
            <Card className="bg-primary shadow-elevation-12 border-none relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/80 flex items-center gap-2">Yard Insights</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="text-4xl font-black text-primary-foreground tracking-tighter">84.2%</div>
                <div className="text-[10px] font-bold text-primary-foreground/70 uppercase">Storage Utilization</div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '84.2%' }} className="h-full bg-white shadow-[0_0_10px_white]" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-panel border-none shadow-elevation-1">
              <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Export Manifests</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full h-12 justify-start gap-3 font-bold text-sm hover:bg-surface-variant/50">
                  <Download className="h-4 w-4 text-primary" /> Daily Batch Report
                </Button>
                <Button variant="outline" className="w-full h-12 justify-start gap-3 font-bold text-sm hover:bg-surface-variant/50">
                  <Printer className="h-4 w-4 text-primary" /> Print All Batch Tags
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </PageLayout>
  );
}