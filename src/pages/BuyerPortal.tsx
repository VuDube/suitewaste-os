import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/PageLayout';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ShieldCheck, Factory, Box, Search, Filter, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
export function BuyerPortal() {
  const { data: lots, isLoading } = useQuery({ queryKey: ['market-lots'], queryFn: () => api<any[]>('/api/marketplace/lots') });
  return (
    <PageLayout>
      <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold tracking-tight">Material Marketplace</h1>
            <p className="text-muted-foreground text-lg">Acquire EPR-certified recycled resources.</p>
          </div>
          <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-500">Verified Industrial Buyer</span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input className="w-full h-14 pl-12 pr-4 bg-card/60 border border-border rounded-xl focus:ring-2 focus:ring-primary/40 outline-none transition-all" placeholder="Search by material, grade or EPR hash..." />
          </div>
          <Button variant="outline" className="h-14 gap-2 px-6">
            <Filter className="h-5 w-5" /> Filters
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {lots?.map((lot, i) => (
            <motion.div key={lot.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
              <Card className="overflow-hidden bg-card/40 border-primary/5 hover:border-primary/20 transition-all group">
                <div className="aspect-video bg-muted relative">
                  <img src={`https://images.unsplash.com/photo-1599153066743-08810dc8a419?auto=format&fit=crop&q=80&w=600`} className="object-cover w-full h-full opacity-60 group-hover:scale-105 transition-transform duration-500" alt={lot.material} />
                  <div className="absolute top-4 right-4"><Badge className="bg-black/60 backdrop-blur-md uppercase text-[10px] font-bold">{lot.epr_status}</Badge></div>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center justify-between">
                    {lot.material}
                    <Badge variant="secondary" className="font-mono">{lot.purity}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-accent/20 border border-border/50">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">Weight</div>
                      <div className="text-lg font-bold">{lot.weight_kg} kg</div>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">Current Price</div>
                      <div className="text-lg font-bold text-primary">Market P.</div>
                    </div>
                  </div>
                  <Button className="w-full h-12 font-bold group">
                    <ShoppingCart className="mr-2 h-4 w-4" /> Place Acquisition Order <ArrowUpRight className="ml-auto h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
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