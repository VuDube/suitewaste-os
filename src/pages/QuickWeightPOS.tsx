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
import { Cable, Printer, Activity, Sparkles, BrainCircuit, XCircle, TrendingUp, ShieldAlert } from "lucide-react";
import { Toaster, toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Supplier } from "@shared/types";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/PageLayout";
import { motion } from "framer-motion";
const WeightDisplay = memo(({ weight, status }: { weight: number; status: string }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <motion.span
        key={weight}
        initial={{ opacity: 0.5, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "text-weight-clamp block leading-none transition-colors drop-shadow-lg",
          (status === 'connected' || status === 'parsing' || status === 'manual')
            ? "bg-gradient-to-b from-leaf to-primary bg-clip-text text-transparent"
            : "text-white/10"
        )}
      >
        {weight.toFixed(2)}
      </motion.span>
      <span className="absolute -bottom-2 -right-14 text-3xl font-black text-leaf uppercase tracking-widest opacity-80">kg</span>
    </div>
    <Badge variant="outline" className="mt-8 gap-3 px-6 py-2.5 font-black uppercase tracking-widest border-leaf/30 text-leaf bg-leaf/5">
      {status === 'manual' ? (
        <>
          <ShieldAlert className="h-4 w-4" />
          <span>Manual Entry Active</span>
        </>
      ) : (status === 'connected' || status === 'parsing') ? (
        <>
          <Activity className="h-4 w-4 animate-pulse" />
          <span>Scale Stream Live</span>
        </>
      ) : (
        <>
          <XCircle className="h-4 w-4 text-white/20" />
          <span className="text-white/20">Scale Offline</span>
        </>
      )}
    </Badge>
  </div>
));
export function QuickWeightPOS() {
  const { user } = useAuth();
  const { weight, status, connect } = useMultiScale();
  const { connect: connectPrinter } = usePrinter();
  const { getPriceForMaterial } = useLME();
  const { classifyMaterial } = useAI_Wingman();
  const addLedgerEntry = useOfflineStore(s => s.addLedgerEntry);
  const addTransaction = useOfflineStore(s => s.addTransaction);
  const pendingLedgerEntries = useOfflineStore(s => s.pendingLedgerEntries);
  const pendingTransactions = useOfflineStore(s => s.pendingTransactions);
  const totalPending = pendingLedgerEntries.length + pendingTransactions.length;
  const [supplierId, setSupplierId] = useState<string>('');
  const [materialType, setMaterialType] = useState("");
  const [amount, setAmount] = useState("");
  const [isAiSuggested, setIsAiSuggested] = useState(false);
  const effectiveWeight = (status === 'connected' || status === 'parsing') ? weight : 0;
  const marketPrice = useMemo(() => getPriceForMaterial(materialType), [materialType, getPriceForMaterial]);
  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api<Supplier[]>('/api/suppliers'),
    enabled: !!user,
  });
  const handleAIClassify = async () => {
    if (effectiveWeight <= 0) {
      toast.error("Stream active weight required for AI analysis");
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
      toast.error("Industrial Validation Error", { description: "Required stream parameters missing." });
      return;
    }
    const ledgerId = addLedgerEntry({
      supplier_id: supplierId,
      material_type: materialType,
      weight_kg: effectiveWeight,
      operator_id: (user?.id ?? 'sys-op-00') as string,
      device_id: (status === 'disconnected') ? 'terminal-manual' : 'main-scale-01',
    });
    addTransaction({
      ledger_entry_id: ledgerId,
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
      <div className="max-w-5xl mx-auto space-y-10 pb-40">
        <section className="relative overflow-hidden rounded-[3rem] glass-panel border-white/10 p-12 flex flex-col items-center justify-center leaf-glow">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-leaf/10 via-transparent to-transparent pointer-events-none" />
          <WeightDisplay weight={effectiveWeight} status={status} />
          <div className="grid grid-cols-2 gap-6 w-full max-w-lg mt-6">
            <Button size="lg" className="h-20 rounded-[2rem] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-elevation-12" onClick={connect} disabled={status === 'connected'}>
              <Cable className="mr-3 h-6 w-6 text-leaf" /> Link Stream
            </Button>
            <Button size="lg" variant="outline" className="h-20 rounded-[2rem] font-black uppercase tracking-widest border-white/10 bg-white/5 hover:bg-white/10 text-white" onClick={connectPrinter}>
              <Printer className="mr-3 h-6 w-6 text-leaf" /> Thermal P.
            </Button>
          </div>
        </section>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8 space-y-8">
            <Card className="glass-panel border-none p-4 rounded-[2rem]">
              <CardContent className="p-6 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-leaf ml-2">Registered Supplier</label>
                  {isLoadingSuppliers ? <Skeleton className="h-16 w-full rounded-2xl bg-white/5" /> : (
                    <Select onValueChange={setSupplierId} value={supplierId}>
                      <SelectTrigger className="h-16 rounded-2xl bg-white/5 border-white/10 font-bold text-white focus:ring-leaf">
                        <SelectValue placeholder="Identify Partner" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl bg-[#1a3620] border-white/10 text-white">
                        {suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-leaf">Material Stream</label>
                    {isAiSuggested && <Badge className="bg-leaf text-white font-black text-[8px] uppercase tracking-tighter">AI Analysis Active</Badge>}
                  </div>
                  <div className="flex gap-4">
                    <Input
                      placeholder="e.g. Copper Grade A"
                      value={materialType}
                      onChange={e => { setMaterialType(e.target.value); setIsAiSuggested(false); }}
                      className="h-16 rounded-2xl bg-white/5 border-white/10 font-bold text-white focus:ring-leaf"
                    />
                    <Button onClick={handleAIClassify} className="h-16 w-16 p-0 rounded-2xl bg-leaf hover:bg-leaf/90 leaf-glow">
                      <BrainCircuit className="h-7 w-7 text-white" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-panel border-none p-4 rounded-[2rem]">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-8">
                  <div className="flex-1 space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-leaf ml-2">Buy Rate (ZAR/kg)</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="h-16 rounded-2xl bg-white/5 border-white/10 font-mono font-black text-2xl text-white pr-16 focus:ring-leaf"
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-leaf font-black text-xs uppercase">ZAR</div>
                    </div>
                  </div>
                  {marketPrice && (
                    <div className="flex-1 p-6 rounded-[1.5rem] bg-leaf/10 border border-leaf/20 flex flex-col justify-center">
                      <div className="text-[9px] font-black uppercase text-leaf mb-2">LME Global Spot</div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-2xl text-white">R{marketPrice.priceZAR.toFixed(2)}</span>
                        <TrendingUp className="h-5 w-5 text-leaf" />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-4">
            <Card className="glass-panel border-none h-full p-6 rounded-[2rem] shadow-elevation-1">
              <CardHeader className="pt-2 px-0">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-leaf flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" /> Integrity Core
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-10 px-0">
                <RiskMeter score={(effectiveWeight > 500) ? 45 : 12} factors={effectiveWeight > 500 ? ['High Yield Batch'] : ['Stream Stability']} />
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/40">
                    <span>Node Sync</span>
                    <Badge className="bg-leaf/20 text-leaf border-none font-black h-5 text-[8px]">{totalPending} Queued</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-leaf animate-pulse shadow-glow" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Edge Node JHB-S Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <motion.div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-8 md:bottom-16" initial={{ y: 100 }} animate={{ y: 0 }}>
          <Button 
            size="lg" 
            onClick={handleCapture} 
            disabled={effectiveWeight <= 0 || !supplierId || !materialType} 
            className="w-full h-24 rounded-[2rem] shadow-elevation-12 bg-[#2E5A35] hover:bg-[#2E5A35]/90 text-white font-black text-2xl uppercase tracking-tighter flex gap-4 leaf-glow transition-all active:scale-95 border-none"
          >
            <Sparkles className="h-10 w-10 text-leaf" />
            Capture Verification
          </Button>
        </motion.div>
      </div>
      <Toaster richColors theme="dark" position="top-center" />
    </PageLayout>
  );
}