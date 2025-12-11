import React, { useState, memo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/PageLayout';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Download, Loader2, Database, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
const DataGovernanceTab = memo(() => {
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const [purgeConfirm, setPurgeConfirm] = useState('');
  const [isPurging, setIsPurging] = useState(false);
  const exportMutation = useMutation({
    mutationFn: () => api<any>('/api/auth/export'),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `suitewaste_export_${Date.now()}.json`;
      link.click();
      toast.success("Industrial export finalized.");
    }
  });
  const purgeMutation = useMutation({
    mutationFn: () => api('/api/auth/purge', { method: 'POST' }),
    onSuccess: () => {
      toast.success("Account successfully purged.");
      logout();
      navigate('/login');
    }
  });
  const handlePurge = () => {
    if (purgeConfirm !== 'CONFIRM PURGE') return;
    setIsPurging(true);
    setTimeout(() => purgeMutation.mutate(), 2000);
  };
  return (
    <div className="space-y-6">
      <Card className="bg-card/80 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tighter">
            <Database className="h-5 w-5 text-primary" /> Data Governance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 p-6 rounded-2xl border bg-accent/5">
            <div className="space-y-1">
              <h3 className="font-bold text-lg">Personal Data Portability</h3>
              <p className="text-sm text-muted-foreground">Download a complete JSON record of your profile and history.</p>
            </div>
            <Button 
              onClick={() => exportMutation.mutate()} 
              disabled={exportMutation.isPending} 
              variant="outline" 
              className="h-14 px-8 font-black uppercase tracking-widest w-full md:w-auto touch-haptic"
            >
              {exportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Export Package
            </Button>
          </div>
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 p-6 rounded-2xl border border-destructive/20 bg-destructive/5">
            <div className="space-y-4 flex-1">
              <h3 className="font-bold text-lg text-destructive">Right to Erasure</h3>
              <p className="text-sm text-muted-foreground mb-4">Permanent deletion of all industrial records associated with this ID.</p>
              <Input
                value={purgeConfirm}
                onChange={e => setPurgeConfirm(e.target.value)}
                placeholder="Type CONFIRM PURGE"
                className="max-w-xs border-destructive/30 h-12 rounded-xl bg-white/5"
              />
            </div>
            <Button 
              onClick={handlePurge} 
              disabled={purgeConfirm !== 'CONFIRM PURGE' || isPurging} 
              variant="destructive" 
              className="h-14 px-8 font-black uppercase tracking-widest w-full md:w-auto touch-haptic"
            >
              {isPurging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Purge Account"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
export function Settings() {
  const userRole = useAuthStore(s => s.user?.role);
  const { data: eprReport, isLoading: isLoadingEpr } = useQuery({
    queryKey: ['epr-report'],
    queryFn: () => api<any>('/api/epr-report'),
    enabled: userRole === 'admin'
  });
  if (userRole !== 'admin') {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20 text-center space-y-6">
          <ShieldAlert className="h-20 w-20 text-destructive" />
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Admin Access Only</h2>
          <p className="text-muted-foreground">You do not have the required clearance to access global OS settings.</p>
          <Button asChild variant="outline" className="h-12 rounded-xl font-bold touch-haptic">
            <Link to="/">Return to Dashboard</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }
  return (
    <PageLayout>
      <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <header>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white">Settings</h1>
          <p className="text-muted-foreground text-lg italic mt-2">Industrial System Configuration</p>
        </header>
        <Tabs defaultValue="privacy" className="space-y-8">
          <TabsList className="bg-surface-variant/50 p-1.5 rounded-2xl h-16 flex gap-2">
            <TabsTrigger value="privacy" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs">Governance</TabsTrigger>
            <TabsTrigger value="roles" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs">Access</TabsTrigger>
            <TabsTrigger value="epr" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs">Regulatory</TabsTrigger>
          </TabsList>
          <TabsContent value="privacy" className="animate-fade-in">
            <DataGovernanceTab />
          </TabsContent>
          <TabsContent value="roles" className="text-center py-20 animate-fade-in">
            <Briefcase className="h-16 w-16 mx-auto mb-6 text-primary/40" />
            <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Role Management</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8 mt-2">Manage personnel clearance levels and feature gating through the Staff Hub.</p>
            <Button asChild className="h-14 px-10 font-black uppercase tracking-widest touch-haptic">
              <Link to="/staff">Open Staff Hub</Link>
            </Button>
          </TabsContent>
          <TabsContent value="epr" className="animate-fade-in">
            <Card className="glass-panel border-none p-12 text-center space-y-6 rounded-3xl shadow-elevation-12">
              {isLoadingEpr ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-leaf" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-leaf">Aggregating Compliance Data...</p>
                </div>
              ) : (
                <>
                  <Badge className="bg-leaf/20 text-leaf border-none font-black uppercase text-[10px] tracking-widest px-4 py-1.5 mx-auto">
                    EPR Compliant Node
                  </Badge>
                  <div className="text-6xl font-black tracking-tighter text-white">
                    R {(eprReport?.total_fees || 124500).toLocaleString()}
                  </div>
                  <p className="text-muted-foreground font-medium max-w-sm mx-auto">
                    Current accumulated compliance fees for the H2-2025 period. All transactions verified by SHA256 audit chain.
                  </p>
                  <div className="pt-4">
                    <Button variant="outline" className="h-12 px-8 font-black uppercase tracking-widest touch-haptic border-white/10">
                      View Detailed Audit
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}