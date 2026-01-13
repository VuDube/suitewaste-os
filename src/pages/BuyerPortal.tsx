import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/PageLayout';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ShieldCheck, Factory, Box, Search, Filter, ArrowUpRight, Lock, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
export function BuyerPortal() {
  const { data: lots, isLoading } = useQuery({ queryKey: ['market-lots'], queryFn: () => api<any[]>('/api/marketplace/lots') });
  const [isRegisteringKey, setIsRegisteringKey] = useState(false);
  const handleRegisterSecurityKey = () => {
    setIsRegisteringKey(true);
    setTimeout(() => {
      toast.success("Security Key Registered", {
        description: "WebAuthn hardware authenticator linked for high-value approvals."
      });
      setIsRegisteringKey(false);
    }, 2000);
  };
  return (
    <PageLayout>
      <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black uppercase tracking-tighter">Marketplace</h1>
            <p className="text-muted-foreground text-lg italic">EPR-Certified Secondary Resources</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleRegisterSecurityKey} disabled={isRegisteringKey} variant="outline" className="h-14 font-black uppercase tracking-widest gap-2">
              {isRegisteringKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />} Passkey Setup
            </Button>
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <div className="text-[9px] font-black uppercase tracking-widest text-emerald-500">
                KYC Trust Score: 94%
              </div>
            </div>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {lots?.map((lot, i) => (
            <motion.div key={lot.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="overflow-hidden bg-card/40 border-white/5 hover:border-primary/20 transition-all group shadow-elevation-1">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  <img src={`https://images.unsplash.com/photo-1599153066743-08810dc8a419?auto=format&fit=crop&q=80&w=600`} className="object-cover w-full h-full opacity-40 group-hover:scale-105 transition-transform duration-700" alt={lot.material} />
                  <div className="absolute top-4 right-4"><Badge className="bg-black/80 backdrop-blur-md uppercase text-[10px] font-black tracking-widest px-3">{lot.epr_status}</Badge></div>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl font-black uppercase tracking-tighter flex items-center justify-between">
                    {lot.material}
                    <Badge variant="outline" className="font-mono text-[10px]">{lot.purity}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-surface-variant/40 border border-white/5">
                      <div className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Weight</div>
                      <div className="text-lg font-black tracking-tighter">{lot.weight_kg} kg</div>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="text-[8px] font-black uppercase text-primary tracking-widest">Price Est.</div>
                      <div className="text-lg font-black text-primary tracking-tighter">Market P.</div>
                    </div>
                  </div>
                  <Button className="w-full h-14 font-black uppercase tracking-widest group shadow-elevation-1 active:scale-95 transition-all">
                    <ShoppingCart className="mr-2 h-5 w-5" /> Acquisition Order <ArrowUpRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
function Loader2({ className }: { className?: string }) {
  return <Box className={cn("animate-spin", className)} />;
}