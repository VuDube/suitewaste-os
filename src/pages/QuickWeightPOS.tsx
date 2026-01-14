import React, { useState, memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMultiScale } from "@/hooks/useMultiScale";
import { usePrinter } from "@/hooks/usePrinter";
import { useOfflineStore } from "@/stores/useOfflineStore";
import { useLME } from "@/hooks/useLME";
import { useAI_Wingman } from "@/hooks/useAI_Wingman";
import { RiskMeter } from "@/components/RiskMeter";
import { cn } from "@/lib/utils";
import { Cable, Printer, Activity, History, Sparkles, BrainCircuit, XCircle, TrendingUp, ShieldAlert } from "lucide-react";
import { Toaster, toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Supplier } from "@shared/types";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/PageLayout";
import { motion, AnimatePresence } from "framer-motion";
const WeightDisplay = memo(({ weight, status }: { weight: number, status: string }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="relative">
      <motion.span
        key={weight}
        initial={{ opacity: 0.5, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "text-weight-clamp block leading-none transition-colors",
          (status === 'connected' || status === 'parsing' || status === 'manual')
            ? "bg-gradient-to-b from-primary to-primary/60 bg-clip-text text-transparent"
            : "text-muted-foreground/20"
        )}
      >
        {weight.toFixed(2)}
      </motion.span>
      <span className="absolute -bottom-2 -right-12 text-2xl font-black text-muted-foreground uppercase tracking-widest">kg</span>
    </div>
    <Badge variant="outline" className="mt-4 gap-2 px-4 py-1.5 font-black uppercase tracking-widest">
      {status === 'manual' ? (
        <>
          <ShieldAlert className="h-3 w-3 text-amber-500" />
          <span className="text-amber-500 font-black uppercase">Manual Entry</span>
        </>
      ) : (status === 'connected' || status === 'parsing') ? (
        <>
          <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
          <span className="text-emerald-500">Live Scale Stream</span>
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
  const { connect: connectPrinter } = usePrinter();
  const { getPriceForMaterial } = useLME();
  const { classifyMaterial } = useAI_Wingman();
  const [manualWeight, setManualWeight] = useState(0.0);
  const addLedgerEntry = useOfflineStore(s => s.addLedgerEntry);
  const addTransaction = useOfflineStore(s => s.addTransaction);
  const totalPending = useOfflineStore(s => s.pendingLedgerEntries.length + s.pendingTransactions.length);
  const [supplierId, setSupplierId] = useState<string>('');
  const [materialType, setMaterialType] = useState("");
  const [amount, setAmount] = useState("");
  const [isAiSuggested, setIsAiSuggested] = useState(false);
  const effectiveWeight = (status === 'connected' || status === 'parsing') ? weight : manualWeight;
  const marketPrice = useMemo(() => getPriceForMaterial(materialType), [materialType, getPriceForMaterial]);
  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api<Supplier[]>('/api/suppliers'),
    enabled: !!user,
  });
  const handleAIClassify = async () => {
    if (effectiveWeight <= 0) {
      toast.error("Need weight before AI analysis");
      return;
    }
    const result = await classifyMaterial(effectiveWeight);
    if (result) {
      setMaterialType(result.material_type);
      if (result.suggested_price_zar) setAmount(result.suggested_price_zar.toString());
      setIsAiSuggested(true);
    }
  };
  const handleCapture = () => {
    if (effectiveWeight <= 0 || !supplierId || !materialType) {
      toast.error("Incomplete Capture Data");
      return;
    }
    const ledgerEntryId = addLedgerEntry({
      supplier_id: supplierId,
      material_type: materialType,
      weight_kg: effectiveWeight,
      operator_id: user?.id,
      device_id: status === 'disconnected' ? 'manual-keypad' : 'main-scale',
    });
    addTransaction({
      ledger_entry_id: ledgerEntryId,
      amount: parseFloat(amount) || 0,
      epr_fee: effectiveWeight * 0.05,
      currency: 'ZAR',
    });
    setMaterialType("");
    setAmount("");
    setIsAiSuggested(false);
  };
  return (
    <PageLayout fullBleed>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="flex flex-col space-y-8 animate-fade-in max-w-5xl mx-auto pb-32">
          <section className="relative overflow-hidden rounded-3xl bg-surface-container/50 border border-white/5 p-8 flex flex-col items-center justify-center shadow-elevation-3">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
            <WeightDisplay weight={effectiveWeight} status={status === 'disconnected' ? 'manual' : status} />
            <div className="grid grid-cols-2 gap-4 w-full max-w-lg mt-4">
              <Button size="lg" variant="secondary" className="h-16 rounded-2xl font-bold touch-haptic" onClick={connect} disabled={status === 'connected'}>
                <Cable className="mr-2 h-6 w-6" /> Link Scale
              </Button>
              <Button size="lg" variant="outline" className="h-16 rounded-2xl font-bold touch-haptic" onClick={connectPrinter}>
                <Printer className="mr-2 h-6 w-6" /> Printer
              </Button>
            </div>
          </section>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
            <div className="md:col-span-8 space-y-6">
              <Card className="glass-panel border-none shadow-elevation-1">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Supplier / Scrap Vendor</label>
                    {isLoadingSuppliers ? <Skeleton className="h-14 w-full rounded-2xl" /> : (
                      <Select onValueChange={setSupplierId} value={supplierId}>
                        <SelectTrigger className="h-14 rounded-2xl border-2 font-bold focus:border-primary">
                          <SelectValue placeholder="Identify Partner" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Material Stream</label>
                      {isAiSuggested && <Badge variant="secondary" className="text-[8px] font-black uppercase">AI Suggested</Badge>}
                    </div>
                    <div className="flex gap-3">
                      <Input
                        placeholder="e.g. Copper Grade A"
                        value={materialType}
                        onChange={e => { setMaterialType(e.target.value); setIsAiSuggested(false); }}
                        className="h-14 rounded-2xl border-2 font-bold focus:border-primary"
                      />
                      <Button variant="secondary" className="h-14 w-14 p-0 rounded-2xl border-2 touch-haptic" onClick={handleAIClassify}>
                        <BrainCircuit className="h-6 w-6 text-primary" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-panel border-none shadow-elevation-1">
                <CardContent className="p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ZAR Buy Rate (/kg)</label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          className="h-14 rounded-2xl border-2 font-mono font-black text-lg pr-16"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-xs uppercase">ZAR</div>
                      </div>
                    </div>
                    {marketPrice && (
                      <div className="flex-1 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col justify-center">
                        <div className="text-[9px] font-black uppercase text-primary mb-1">LME Global Price</div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-xl">R{marketPrice.priceZAR.toFixed(2)}</span>
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-4 space-y-6">
              <Card className="glass-panel border-none h-full shadow-elevation-1">
                <CardHeader>
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-primary" /> System Integrity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <RiskMeter score={effectiveWeight > 500 ? 45 : 12} factors={effectiveWeight > 500 ? ['High Volume Transaction'] : ['Stable Stream']} />
                  <div className="p-4 rounded-2xl bg-surface-variant/50 border border-white/5 space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>Sync Status</span>
                      <Badge variant="outline" className="text-[9px] h-5">{totalPending} Queued</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase">Edge Computing Active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <motion.div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-6 md:bottom-12" initial={{ y: 100 }} animate={{ y: 0 }}>
            <Button size="lg" onClick={handleCapture} disabled={effectiveWeight <= 0 || !supplierId || !materialType} className="w-full h-20 rounded-3xl shadow-elevation-12 bg-primary text-primary-foreground font-black text-xl uppercase tracking-widest flex gap-3 active:scale-95 transition-all">
              <Sparkles className="h-8 w-8" /> Capture Verification
            </Button>
          </motion.div>
        </div>
      </div>
      <Toaster richColors theme="dark" position="top-center" />
    </PageLayout>
  );
}