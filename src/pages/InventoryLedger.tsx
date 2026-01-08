import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { InventoryLedgerEntry, Supplier } from '@shared/types';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Filter, CheckCircle, CircleDashed, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
export function InventoryLedger() {
  const [materialFilter, setMaterialFilter] = useState('All');
  const [page, setPage] = useState(1);
  const { data: ledgerEntries, isLoading } = useQuery({
    queryKey: ['ledger'],
    queryFn: () => api<InventoryLedgerEntry[]>('/api/ledger'),
  });
  const categories = ['All', 'Metals', 'Plastic', 'Electronic', 'Glass', 'Paper'];
  const filteredEntries = useMemo(() => {
    if (materialFilter === 'All') return ledgerEntries || [];
    return (ledgerEntries || []).filter(e => 
      e.material_type.toLowerCase().includes(materialFilter.toLowerCase())
    );
  }, [ledgerEntries, materialFilter]);
  return (
    <PageLayout>
      <div className="space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Ledger</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl touch-haptic"><Filter className="h-5 w-5" /></Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>Advanced Filters</DialogTitle>
                <DialogDescription>Apply multi-axis filtering to the industrial ledger chain.</DialogDescription>
              </DialogHeader>
              <div className="h-48 flex items-center justify-center text-muted-foreground font-bold italic">Date Range & Operator Filters</div>
            </DialogContent>
          </Dialog>
        </header>
        {/* Horizontal Chips (M3 Pattern) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setMaterialFilter(cat)}
              className={cn(
                "px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all touch-haptic shadow-elevation-1",
                materialFilter === cat ? "bg-primary text-primary-foreground" : "bg-surface-variant text-muted-foreground hover:bg-white/5"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <Card className="glass-panel border-none p-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto scrollbar-hide">
              <Table>
                <TableHeader className="bg-surface-variant/30">
                  <TableRow className="hover:bg-transparent border-b-white/5">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-14">Identity</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-14 text-right">Mass (kg)</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-14 text-center">Chain</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={3} className="px-6 py-4"><Skeleton className="h-12 w-full rounded-xl" /></TableCell></TableRow>
                    ))
                  ) : filteredEntries.length > 0 ? (
                    filteredEntries.map(entry => (
                      <TableRow key={entry.id} className="hover:bg-white/5 border-b-white/5 transition-colors touch-haptic">
                        <TableCell className="px-6 py-5">
                          <div className="font-bold text-sm leading-tight">{entry.material_type}</div>
                          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter mt-1">
                            {format(entry.capture_timestamp, 'HH:mm �� dd MMM')}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5 text-right font-mono font-black text-lg text-primary">
                          {entry.weight_kg.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-6 py-5 text-center">
                          {entry.is_synced ? (
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10"><CheckCircle className="h-4 w-4 text-emerald-500" /></div>
                          ) : (
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10"><CircleDashed className="h-4 w-4 text-orange-500 animate-spin" /></div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={3} className="h-48 text-center text-muted-foreground font-bold italic">No records in stream.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}