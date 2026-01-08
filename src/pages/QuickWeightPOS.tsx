import React, { useState, memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSerialScale } from "@/hooks/useSerialScale";
import { useMultiScale } from "@/hooks/useMultiScale";
import { usePrinter } from "@/hooks/usePrinter";
import { useOfflineStore } from "@/stores/useOfflineStore";
import { cn } from "@/lib/utils";
import { Cable, CheckCircle, CircleDashed, Loader2, Send, XCircle, ArrowLeft, BrainCircuit, Sparkles, Printer, Activity } from "lucide-react";
import { Toaster, toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Supplier, WasteStreamType } from "@shared/types";
import { v4 as uuid } from 'uuid';
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/PageLayout";
import { motion, AnimatePresence } from "framer-motion";
const WeightDisplay = memo(({ weight, status }: { weight: number, status: string }) => (
  <div className="relative w-full text-center mb-6">
    <span
      className={cn(
        "font-mono font-bold tabular-nums transition-all duration-500",
        "text-[clamp(5rem,20vw,12rem)] sm:text-[clamp(6rem,25vw,14rem)]",
        status === 'connected' || status === 'parsing'
          ? "bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent animate-pulse"
          : "text-muted-foreground/50"
      )}
    >
      {weight.toFixed(2)}
    </span>
    <span className="absolute bottom-1 right-0 text-2xl md:text-4xl font-medium text-muted-foreground">kg</span>
  </div>
));
export function QuickWeightPOS() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { weight, status, connect } = useSerialScale();
  const { status: printerStatus, connect: connectPrinter } = usePrinter();
  const addLedgerEntry = useOfflineStore(s => s.addLedgerEntry);
  const addTransaction = useOfflineStore(s => s.addTransaction);
  const syncAllPending = useOfflineStore(s => s.syncAllPending);
  const totalPending = useOfflineStore(s => s.totalPending());
  const [supplierId, setSupplierId] = useState<string>('');
  const [materialType, setMaterialType] = useState("");
  const [amount, setAmount] = useState("");
  const [isAiClassifying, setIsAiClassifying] = useState(false);
  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api<Supplier[]>('/api/suppliers'),
    enabled: !!user,
  });
  const handleAiClassify = async () => {
    if (!materialType.trim()) {
      toast.error("Enter a material description first");
      return;
    }
    setIsAiClassifying(true);
    try {
      const res = await api<{ suggestedStream: WasteStreamType }>('/api/ai/classify', {
        method: 'POST',
        body: JSON.stringify({ material: materialType })
      });
      setMaterialType(res.suggestedStream);
      toast.success(`AI Classified: ${res.suggestedStream}`, {
        icon: <Sparkles className="h-4 w-4 text-primary" />
      });
    } catch (e) {
      toast.error("Classification failed");
    } finally {
      setIsAiClassifying(false);
    }
  };
  const handleCapture = () => {
    if (status !== 'connected' && status !== 'parsing') {
      toast.error("Scale not linked");
      return;
    }
    if (weight <= 0) {
      toast.error("Invalid weight");
      return;
    }
    if (!supplierId || !materialType) {
      toast.error("Required fields missing");
      return;
    }
    const ledgerEntryId = uuid();
    addLedgerEntry({
      id: ledgerEntryId,
      supplier_id: supplierId,
      material_type: materialType.trim(),
      weight_kg: weight,
      operator_id: user?.id,
    });
    addTransaction({
      ledger_entry_id: ledgerEntryId,
      amount: parseFloat(amount) || 0,
      epr_fee: weight * 0.1,
      currency: 'ZAR',
    });
    setMaterialType("");
    setAmount("");
  };
  return (
    <PageLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-card/80 border-border backdrop-blur-xl shadow-glow shadow-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors uppercase text-xs font-bold tracking-tighter">
                <ArrowLeft className="h-4 w-4" /> Dashboard
              </Link>
              <Badge variant="outline" className="gap-2 px-3 py-1 font-bold">
                {status === 'connected' ? <Activity className="h-3 w-3 text-green-500 animate-pulse" /> : <XCircle className="h-3 w-3 text-red-500" />}
                {status.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-12 min-h-[450px]">
              <WeightDisplay weight={weight} status={status} />
              <div className="w-full flex gap-4 mt-8">
                <Button size="lg" className="flex-1 h-20 text-2xl font-bold shadow-primary/40 shadow-xl" onClick={handleCapture} disabled={status !== 'connected' && status !== 'parsing'}>
                  Capture & Post
                </Button>
                <Button size="lg" variant="outline" className="h-20 px-8" onClick={connect} disabled={status === 'connected'}>
                  <Cable className="h-8 w-8" />
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-accent/10 border-border/50">
            <CardContent className="p-4 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Activity className={cn("h-4 w-4", status === 'connected' ? "text-emerald-500" : "text-muted-foreground")} />
                  Scale: {status}
                </div>
                <div className="flex items-center gap-2">
                  <Printer className={cn("h-4 w-4", printerStatus === 'connected' ? "text-emerald-500" : "text-muted-foreground")} />
                  Printer: {printerStatus}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={connectPrinter} className="h-8 text-[10px] font-black hover:text-primary">
                RE-LINK HARDWARE
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="bg-card/80 border-border shadow-soft">
            <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Entry Details</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Partner Account</label>
                {isLoadingSuppliers ? <Skeleton className="h-14 w-full" /> : (
                  <Select onValueChange={setSupplierId} value={supplierId}>
                    <SelectTrigger className="h-14 bg-secondary/50 font-bold"><SelectValue placeholder="Select Partner" /></SelectTrigger>
                    <SelectContent>{suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Material Category</label>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <Input placeholder="Describe material..." value={materialType} onChange={e => setMaterialType(e.target.value)} className="h-14 bg-secondary/50 font-bold" />
                    <AnimatePresence>
                      {isAiClassifying && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/10 backdrop-blur-[1px] rounded-lg overflow-hidden">
                          <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 2, repeat: Infinity }} className="absolute w-full h-1 bg-primary/40 shadow-glow shadow-primary" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <Button variant="secondary" className="h-14 w-14 p-0 border border-primary/20 hover:bg-primary/10" onClick={handleAiClassify} disabled={isAiClassifying || !materialType}>
                    {isAiClassifying ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <BrainCircuit className="h-6 w-6 text-primary" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Transaction Value (ZAR)</label>
                <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="h-14 bg-secondary/50 font-mono font-bold text-lg" />
              </div>
              <Button onClick={() => syncAllPending()} disabled={totalPending === 0} className="w-full h-14 bg-accent/50 text-accent-foreground font-bold" variant="secondary">
                <Send className="mr-2 h-4 w-4" /> Sync Local Queue ({totalPending})
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster richColors theme="dark" position="top-center" />
    </PageLayout>
  );
}