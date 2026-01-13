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
      link.download = `suitewaste_export_${Date.now()}.json`;
      link.click();
      toast.success("Export finalized.");
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
            <Button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending} variant="outline" className="h-14 px-8 font-black uppercase tracking-widest w-full md:w-auto">
              {exportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Export Package
            </Button>
          </div>
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 p-6 rounded-2xl border border-destructive/20 bg-destructive/5">
            <div className="space-y-4 flex-1">
              <h3 className="font-bold text-lg text-destructive">Right to Erasure</h3>
              <Input
                value={purgeConfirm}
                onChange={e => setPurgeConfirm(e.target.value)}
                placeholder="Type CONFIRM PURGE"
                className="max-w-xs border-destructive/30 h-12 rounded-xl"
              />
            </div>
            <Button onClick={handlePurge} disabled={purgeConfirm !== 'CONFIRM PURGE' || isPurging} variant="destructive" className="h-14 px-8 font-black uppercase tracking-widest w-full md:w-auto">
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
          <h2 className="text-3xl font-black uppercase tracking-tighter">Admin Access Only</h2>
          <Button asChild variant="outline" className="h-12 rounded-xl font-bold">
            <Link to="/">Return to Dashboard</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }
  return (
    <PageLayout>
      <div className="space-y-10 max-w-7xl mx-auto">
        <header>
          <h1 className="text-5xl font-black uppercase tracking-tighter">Settings</h1>
        </header>
        <Tabs defaultValue="privacy" className="space-y-8">
          <TabsList className="bg-surface-variant/50 p-1.5 rounded-2xl h-16 flex gap-2">
            <TabsTrigger value="privacy" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs">Governance</TabsTrigger>
            <TabsTrigger value="roles" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs">Access</TabsTrigger>
            <TabsTrigger value="epr" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs">Regulatory</TabsTrigger>
          </TabsList>
          <TabsContent value="privacy"><DataGovernanceTab /></TabsContent>
          <TabsContent value="roles" className="text-center p-20">
            <Briefcase className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-4">Roles Managed via Staff Hub</h3>
            <Button asChild><Link to="/staff">Go to Staff Hub</Link></Button>
          </TabsContent>
          <TabsContent value="epr">
            <Card className="p-12 text-center space-y-4">
              {isLoadingEpr ? <Loader2 className="animate-spin mx-auto" /> : (
                <>
                  <Badge className="bg-emerald-500/10 text-emerald-500">EPR Compliant</Badge>
                  <div className="text-4xl font-black">R {(eprReport?.total_fees || 0).toLocaleString()}</div>
                  <p className="text-muted-foreground">Accumulated compliance fees.</p>
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}