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
  const { status: printerStatus, connect: connectPrinter } = usePrinter();
  const { getPriceForMaterial } = useLME();
  const [manualStr, setManualStr] = useState('');
  const [manualWeight, setManualWeight] = useState(0.0);
  const addLedgerEntry = useOfflineStore(s => s.addLedgerEntry);
  const addTransaction = useOfflineStore(s => s.addTransaction);
  const totalPending = useOfflineStore(s => s.pendingLedgerEntries.length + s.pendingTransactions.length);

  React.useEffect(() => {
    if(status === 'connected' || status === 'parsing') {
      setManualStr('');
      setManualWeight(0);
    }
  }, [status]);
  const [supplierId, setSupplierId] = useState<string>('');
  const [materialType, setMaterialType] = useState("");
  const [amount, setAmount] = useState("");
  const marketPrice = useMemo(() => getPriceForMaterial(materialType), [materialType, getPriceForMaterial]);

  const effectiveWeight = (status === 'connected' || status === 'parsing') ? weight : manualWeight;
  const effectiveStatus = status === 'disconnected' ? 'manual' : status;
  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api<Supplier[]>('/api/suppliers'),
    enabled: !!user,
  });
  const riskScore = useMemo(() => {
    let score = 10;
    if (!supplierId) return 0;
    const supplier = suppliers?.find(s => s.id === supplierId);
    if (supplier && !supplier.is_weee_compliant) score += 15;
    if (effectiveWeight > 500) score += 20;
    if (parseFloat(amount) > (marketPrice?.priceZAR || 0) * 1.2) score += 30;
    return Math.min(score, 100);
  }, [supplierId, suppliers, effectiveWeight, amount, marketPrice]);
  const handleNum = (digit: string) => {
    const newStr = manualStr + digit;
    setManualStr(newStr);
    const num = parseFloat(newStr);
    setManualWeight(isNaN(num) ? 0 : num);
  };

  const handleClear = () => {
    setManualStr('');
    setManualWeight(0);
  };

  const handleDot = () => {
    if(!manualStr.includes('.')) handleNum('.');
  };

  const handleBackspace = () => {
    const newStr = manualStr.slice(0, -1);
    setManualStr(newStr);
    setManualWeight(parseFloat(newStr) || 0);
  };

  const handleManualConfirm = () => {
    if(manualWeight > 0) {
      toast.success(`Manual weight locked: ${manualWeight.toFixed(2)} kg`);
    } else {
      toast.error('Enter valid weight > 0 kg');
    }
  };

  const handleCapture = () => {
    const captureWeight = effectiveWeight;
    if (captureWeight <= 0 || !supplierId || !materialType) {
      toast.error("Incomplete Capture Data");
      return;
    }
    const ledgerEntryId = crypto.randomUUID();
    addLedgerEntry({
      id: ledgerEntryId,
      supplier_id: supplierId,
      material_type: materialType.trim(),
      weight_kg: captureWeight,
      operator_id: user?.id,
      device_id: effectiveStatus === 'manual' ? 'manual-keypad' : devices[0]?.id || 'main-scale',
    });
    addTransaction({
      ledger_entry_id: ledgerEntryId,
      amount: parseFloat(amount) || 0,
      epr_fee: captureWeight * 0.05,
      currency: 'ZAR',
    });
    setMaterialType("");
    setAmount("");
    toast.success(
      `Transaction Securely Queued${effectiveStatus === 'manual' ? ' (Manual Entry)' : ''}`, 
      { icon: <History className="h-4 w-4" /> }
    );
  };
  return (
    <PageLayout fullBleed>
      <div className="flex flex-col min-h-full space-y-8 animate-fade-in max-w-5xl mx-auto px-4 pb-32">
        <section className="relative overflow-hidden rounded-3xl bg-surface-container/50 border border-white/5 p-8 flex flex-col items-center justify-center shadow-elevation-3 mt-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
          <WeightDisplay weight={effectiveWeight} status={effectiveStatus} />
          <div className="grid grid-cols-2 gap-4 w-full max-w-lg mt-4">
            <Button size="lg" variant="secondary" className="h-16 rounded-2xl font-bold touch-haptic" onClick={connect} disabled={status === 'connected'}>
              <Cable className="mr-2 h-6 w-6" /> Link Scale
            </Button>
            <Button size="lg" variant="outline" className="h-16 rounded-2xl font-bold touch-haptic" onClick={connectPrinter}>
              <Printer className={cn("mr-2 h-6 w-6", printerStatus === 'connected' ? "text-primary" : "")} /> Printer
            </Button>
          </div>
          {(status !== 'connected' && status !== 'parsing') && (
            <>
              <div className="w-full max-w-sm mx-auto mb-6">
                <Input 
                  type="number" 
                  step="0.01" 
                  value={manualStr} 
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d.]/g, "");
                    if(val.endsWith('.')) setManualStr(val);
                    else setManualStr(val);
                    setManualWeight(parseFloat(val) || 0);
                  }} 
                  placeholder="0.00" 
                  className="h-20 text-4xl font-mono text-center rounded-3xl mx-auto block shadow-2xl border-2 border-amber-500/50 bg-amber-500/5" 
                />
              </div>
              <div className="grid grid-cols-3 gap-4 w-full max-w-md mx-auto p-6 rounded-3xl bg-gradient-to-b from-surface-container/90 to-white/10 backdrop-blur-xl border border-amber-400/20 shadow-2xl">
                {[['1','2','3'],['4','5','6'],['7','8','9']].map((row,i)=>(
                  <div key={i} className="flex gap-4">
                    {row.map(d=>(
                      <Button
                        key={d}
                        variant="outline"
                        size="lg"
                        className="h-[60px] flex-1 rounded-2xl font-black text-xl shadow-md hover:shadow-lg transition-all touch-haptic"
                        onClick={()=>handleNum(d)}
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                ))}
                <div className="col-span-3 flex gap-4">
                  <Button variant="outline" size="lg" className="h-[60px] flex-[2] rounded-2xl font-black text-xl shadow-md hover:shadow-lg transition-all touch-haptic" onClick={() => handleNum('0')}>0</Button>
                  <div className="flex-[1]" />
                </div>
                <div className="flex gap-4 col-span-3 mt-3">
                  <Button variant="destructive" className="h-[60px] flex-1 rounded-2xl font-black text-xl shadow-md" onClick={handleBackspace}>⌫</Button>
                  <Button variant="outline" className="h-[60px] flex-1 rounded-2xl font-black text-xl shadow-md" onClick={handleDot}>.</Button>
                  <div className="flex-1" />
                  <Button className="h-[60px] w-[80px] bg-amber-500 hover:bg-amber-600 text-amber-foreground font-black text-lg rounded-2xl shadow-lg" onClick={handleManualConfirm}>OK</Button>
                </div>
                <Button className="col-span-3 h-[60px] mt-4 bg-primary shadow-xl" onClick={connect} disabled={status==='connecting'}>
                  <Cable className="mr-2 h-5 w-5" /> Retry Scale Link
                </Button>
              </div>
              <Card className="mt-6 max-w-md mx-auto border-amber-200/50 bg-amber-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs uppercase tracking-widest text-amber-600 font-black">Scale Connection Guide</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-2 text-muted-foreground leading-tight">
                  <p><strong>1.</strong> Plug USB securely</p>
                  <p><strong>2.</strong> Click "Retry Scale Link"</p>
                  <p><strong>3.</strong> Allow browser access</p>
                  <p><strong>4.</strong> Select correct COM port</p>
                  <p><strong>5.</strong> Verify baud 9600 on device</p>
                </CardContent>
              </Card>
            </>
          )}
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
                        {suppliers?.map(s => <SelectItem key={s.id} value={s.id} className="h-12">{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Material Stream / Grade</label>
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
                      <div className="text-[9px] font-black uppercase text-primary mb-1">LME Market Suggestion</div>
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
                  <ShieldAlert className="h-4 w-4 text-primary" /> Integrity Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <RiskMeter score={riskScore} factors={riskScore > 30 ? ['Price Variance Detected'] : ['Stable Data']} />
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
        <motion.div
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-6 md:bottom-12"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
        >
          <Button
            size="lg"
            onClick={handleCapture}
            disabled={effectiveWeight <= 0 || !supplierId || !materialType}
            className="w-full h-20 rounded-3xl shadow-elevation-12 bg-primary text-primary-foreground font-black text-xl uppercase tracking-widest flex gap-3 group active:scale-95 transition-all"
          >
            <Sparkles className="h-8 w-8 transition-transform group-hover:rotate-12" />
            Capture Verification
          </Button>
        </motion.div>
      </div>
      <Toaster richColors theme="dark" position="top-center" />
    </PageLayout>
  );
}