import React, { useState, memo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/PageLayout';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/useAuthStore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert, Download, Loader2, Database, Trash2, History, Briefcase, FileCheck, ShieldCheck } from 'lucide-react';
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
      link.download = `suitewaste_data_export_${Date.now()}.json`;
      link.click();
      toast.success("Data portability export finalized.", {
        description: "Your industrial data package is ready."
      });
    },
    onError: (err) => {
      toast.error("Export Failed", { description: err.message });
    }
  });
  const purgeMutation = useMutation({
    mutationFn: () => api('/api/auth/purge', { method: 'POST' }),
    onSuccess: () => {
      toast.success("Account successfully purged from system.");
      logout();
      navigate('/login');
    },
    onError: (err) => {
      setIsPurging(false);
      toast.error("Purge Failed", { description: err.message });
    }
  });
  const handlePurge = async () => {
    if (purgeConfirm !== 'CONFIRM PURGE') return;
    setIsPurging(true);
    toast.info("Beginning secure erasure in 3 seconds...", { duration: 3000 });
    setTimeout(() => {
      purgeMutation.mutate();
    }, 3000);
  };
  return (
    <div className="space-y-6">
      <Card className="bg-card/80 border-border">
        <CardHeader><CardTitle className="flex items-center gap-2 font-black uppercase tracking-tighter"><Database className="h-5 w-5 text-primary" /> Data Governance</CardTitle></CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 p-6 rounded-2xl border bg-accent/5">
            <div className="space-y-1">
              <h3 className="font-bold text-lg">Personal Data Portability</h3>
              <p className="text-sm text-muted-foreground max-w-md">Download a complete JSON record of your profile, ledger entries, and transaction history as required by POPIA / GDPR.</p>
            </div>
            <Button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending} variant="outline" className="h-14 px-8 font-black uppercase tracking-widest touch-haptic w-full md:w-auto">
              {exportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Export Package
            </Button>
          </div>
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 p-6 rounded-2xl border border-destructive/20 bg-destructive/5">
            <div className="space-y-4 flex-1">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-destructive">Right to Erasure</h3>
                <p className="text-sm text-muted-foreground italic max-w-md">Permanently erase your identity and non-audit personal data. Audit-chain hashes remain for compliance but personal link is severed.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1">Type "CONFIRM PURGE" to proceed</label>
                <Input 
                  value={purgeConfirm} 
                  onChange={e => setPurgeConfirm(e.target.value)} 
                  placeholder="Verification text..." 
                  className="max-w-xs border-destructive/30 h-12 rounded-xl bg-background"
                />
              </div>
            </div>
            <Button 
              onClick={handlePurge} 
              disabled={purgeConfirm !== 'CONFIRM PURGE' || isPurging} 
              variant="destructive" 
              className="h-14 px-8 font-black uppercase tracking-widest touch-haptic w-full md:w-auto shadow-lg shadow-destructive/20"
            >
              {isPurging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />} Purge Account
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader><CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><History className="h-4 w-4" /> Compliance Chain Integrity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Your activity is currently linked to the genesis block via SHA256 hashing. All exports include these verification hashes to maintain regulatory auditability.</p>
        </CardContent>
      </Card>
    </div>
  );
});
export function Settings() {
  const user = useAuthStore(s => s.user);
  const userRole = user?.role;
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
          <h2 className="text-3xl font-black uppercase tracking-tighter">Admin Access Only</h2>
          <p className="text-muted-foreground text-lg">System-wide governance policies require administrative clearance.</p>
          <Button asChild variant="outline" className="h-12 rounded-xl font-bold"><Link to="/">Return to Dashboard</Link></Button>
        </div>
      </PageLayout>
    );
  }
  return (
    <PageLayout>
      <div className="space-y-10 max-w-7xl mx-auto">
        <header>
          <h1 className="text-5xl font-black uppercase tracking-tighter">Settings</h1>
          <p className="text-muted-foreground text-lg mt-2">Industrial system governance & compliance controls.</p>
        </header>
        <Tabs defaultValue="privacy" className="space-y-8">
          <TabsList className="bg-surface-variant/50 p-1.5 rounded-2xl h-16 flex gap-2">
            <TabsTrigger value="privacy" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Governance</TabsTrigger>
            <TabsTrigger value="roles" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Access</TabsTrigger>
            <TabsTrigger value="epr" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Regulatory</TabsTrigger>
          </TabsList>
          <TabsContent value="privacy" className="animate-fade-in">
            <DataGovernanceTab />
          </TabsContent>
          <TabsContent value="roles" className="animate-fade-in">
            <Card className="p-16 text-center space-y-6 border-none glass-panel">
              <Briefcase className="h-16 w-16 mx-auto text-primary" />
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Unified HR Management</h3>
                <p className="text-muted-foreground max-w-md mx-auto">User roles and industrial permissions are consolidated in the Staff Manager for real-time shift accountability.</p>
              </div>
              <Button asChild className="h-14 px-10 font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20">
                <Link to="/staff">Open Staff Manager</Link>
              </Button>
            </Card>
          </TabsContent>
          <TabsContent value="epr" className="animate-fade-in">
            <Card className="border-none glass-panel overflow-hidden">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-sm">
                  <FileCheck className="h-4 w-4" /> SARS / DFFE Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-12 text-center space-y-6">
                {isLoadingEpr ? (
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                ) : (
                  <>
                    <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black text-xs uppercase tracking-widest">
                      <ShieldCheck className="h-4 w-4" /> EPR Compliant
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black uppercase tracking-tighter">EPR Credit Balance</h3>
                      <div className="text-5xl font-black text-primary tabular-nums">ZAR {(eprReport?.total_fees || 0).toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">Accumulated compliance fees for the current national waste collection period.</p>
                    </div>
                    <Button asChild variant="outline" className="h-12 px-8 rounded-xl font-bold border-primary/20">
                      <Link to="/audit">Verify Chain of Custody</Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}