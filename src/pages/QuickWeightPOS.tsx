import React, { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMultiScale } from "@/hooks/useMultiScale";
import { usePrinter } from "@/hooks/usePrinter";
import { useOfflineStore } from "@/stores/useOfflineStore";
import { cn } from "@/lib/utils";
import { Cable, Send, XCircle, BrainCircuit, Sparkles, Printer, Activity, History } from "lucide-react";
import { Toaster, toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Supplier } from "@shared/types";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/PageLayout";
import { motion } from "framer-motion";
const WeightDisplay = memo(({ weight, status }: { weight: number, status: string }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="relative">
      <motion.span
        key={weight}
        initial={{ opacity: 0.5, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "text-weight-clamp block leading-none transition-colors",
          (status === 'connected' || status === 'parsing')
            ? "bg-gradient-to-b from-primary to-primary/60 bg-clip-text text-transparent"
            : "text-muted-foreground/20"
        )}
      >
        {weight.toFixed(2)}
      </motion.span>
      <span className="absolute -bottom-2 -right-12 text-2xl font-black text-muted-foreground uppercase tracking-widest">kg</span>
    </div>
    <Badge variant="outline" className="mt-4 gap-2 px-4 py-1.5 font-black uppercase tracking-widest">
      {(status === 'connected' || status === 'parsing') ? (
        <>
          <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
          <span className="text-emerald-500">Live Stream</span>
        </>
      ) : (
        <>
          <XCircle className="h-3 w-3 text-destructive" />
          <span className="text-destructive">Scale Disconnected</span>
        </>
      )}
    </Badge>
  </div>
));
export function QuickWeightPOS() {
  const { user } = useAuth();
  const { weight, status, connect, devices } = useMultiScale();
  const { status: printerStatus, connect: connectPrinter } = usePrinter();
  const addLedgerEntry = useOfflineStore(s => s.addLedgerEntry);
  const addTransaction = useOfflineStore(s => s.addTransaction);
  const pendingLedgerCount = useOfflineStore(s => s.pendingLedgerEntries.length);
  const pendingTransactionCount = useOfflineStore(s => s.pendingTransactions.length);
  const totalPending = pendingLedgerCount + pendingTransactionCount;
  const [supplierId, setSupplierId] = useState<string>('');
  const [materialType, setMaterialType] = useState("");
  const [amount, setAmount] = useState("");
  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api<Supplier[]>('/api/suppliers'),
    enabled: !!user,
  });
  const handleCapture = () => {
    if (weight <= 0 || !supplierId || !materialType) {
      toast.error("Invalid capture data");
      return;
    }
    const ledgerEntryId = crypto.randomUUID();
    addLedgerEntry({
      id: ledgerEntryId,
      supplier_id: supplierId,
      material_type: materialType.trim(),
      weight_kg: weight,
      operator_id: user?.id,
      device_id: devices[0]?.id || 'main-scale',
    });
    addTransaction({
      ledger_entry_id: ledgerEntryId,
      amount: parseFloat(amount) || 0,
      epr_fee: weight * 0.05,
      currency: 'ZAR',
    });
    setMaterialType("");
    setAmount("");
    toast.success("Transaction Queued", { icon: <History className="h-4 w-4" /> });
  };
  return (
    <PageLayout fullBleed>
      <div className="flex flex-col min-h-full space-y-8 animate-fade-in">
        <section className="relative overflow-hidden rounded-3xl bg-surface-container/50 border border-white/5 p-8 flex flex-col items-center justify-center shadow-elevation-3">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <WeightDisplay weight={weight} status={status} />
          <div className="grid grid-cols-2 gap-4 w-full max-w-lg mt-4">
            <Button size="lg" variant="secondary" className="h-16 rounded-2xl font-bold touch-haptic" onClick={connect} disabled={status === 'connected'}>
              <Cable className="mr-2 h-6 w-6" /> Link Scale
            </Button>
            <Button size="lg" variant="outline" className="h-16 rounded-2xl font-bold touch-haptic" onClick={connectPrinter}>
              <Printer className={cn("mr-2 h-6 w-6", printerStatus === 'connected' ? "text-primary" : "")} /> Printer
            </Button>
          </div>
        </section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
          <Card className="glass-panel border-none">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Supplier / Partner</label>
                {isLoadingSuppliers ? <Skeleton className="h-14 w-full rounded-2xl" /> : (
                  <Select onValueChange={setSupplierId} value={supplierId}>
                    <SelectTrigger className="h-14 rounded-2xl border-2 font-bold focus:border-primary shadow-elevation-1">
                      <SelectValue placeholder="Identify Supplier" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {suppliers?.map(s => <SelectItem key={s.id} value={s.id} className="h-12">{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Material Stream</label>
                <div className="flex gap-3">
                  <Input
                    placeholder="e.g. Copper Grade A"
                    value={materialType}
                    onChange={e => setMaterialType(e.target.value)}
                    className="h-14 rounded-2xl border-2 font-bold focus:border-primary shadow-elevation-1"
                  />
                  <Button variant="secondary" className="h-14 w-14 p-0 rounded-2xl border-2 touch-haptic">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-panel border-none">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Unit Price (ZAR/kg)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="h-14 rounded-2xl border-2 font-mono font-bold text-lg shadow-elevation-1"
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20">
                <span className="text-xs font-bold uppercase text-primary">Pending Sync</span>
                <Badge className="font-mono">{totalPending} Items</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        <motion.div className="fixed bottom-28 right-6 z-50 md:right-12" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="lg"
            onClick={handleCapture}
            disabled={weight <= 0 || !supplierId}
            className="h-20 px-8 rounded-3xl shadow-elevation-12 bg-primary text-primary-foreground font-black text-xl uppercase tracking-widest flex gap-3 group"
          >
            <Sparkles className="h-8 w-8 transition-transform group-hover:rotate-12" />
            Capture
          </Button>
        </motion.div>
      </div>
      <Toaster richColors theme="dark" position="top-center" />
    </PageLayout>
  );
}