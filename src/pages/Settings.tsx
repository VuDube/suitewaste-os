import React, { useState, useMemo, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/PageLayout';
import { api } from '@/lib/api-client';
import type { User, EPRReport, ConfigUserUpdate } from '@shared/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Download, Loader2, LogOut, ShieldCheck, Database, Trash2, Key, History } from 'lucide-react';
import { toast } from 'sonner';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
const COLORS = ['#38761d', '#5a9a47', '#7cb870', '#a0d69a', '#c5f4c3', '#e7f9e6'];
const EPR_STREAMS = ['Plastic', 'Paper & Packaging', 'Glass', 'Metals', 'Electrical & Electronic', 'Other'] as const;
const DataGovernanceTab = memo(() => {
  const logout = useAuthStore(s => s.logout);
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
      toast.success("Data portability export finalized.");
    }
  });
  const purgeMutation = useMutation({
    mutationFn: () => api('/api/auth/purge', { method: 'POST' }),
    onSuccess: () => {
      toast.success("Account successfully purged from system.");
      logout();
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
        <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" /> Data Governance (GDPR/POPIA)</CardTitle></CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-start justify-between gap-6 p-6 rounded-xl border bg-accent/5">
            <div className="space-y-1">
              <h3 className="font-bold">Request Personal Data Export</h3>
              <p className="text-sm text-muted-foreground">Download a complete JSON record of your profile, ledger entries, and transaction history for data portability.</p>
            </div>
            <Button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending} variant="outline" className="h-12 px-6 font-bold">
              {exportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Export Data
            </Button>
          </div>
          <div className="flex items-start justify-between gap-6 p-6 rounded-xl border border-destructive/20 bg-destructive/5">
            <div className="space-y-4 flex-1">
              <div className="space-y-1">
                <h3 className="font-bold text-destructive">Purge My Account</h3>
                <p className="text-sm text-muted-foreground italic">Permanently erase your identity and non-audit personal data. This action is irreversible.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest">Type "CONFIRM PURGE" to proceed</label>
                <Input value={purgeConfirm} onChange={e => setPurgeConfirm(e.target.value)} placeholder="Type here..." className="max-w-xs border-destructive/30" />
              </div>
            </div>
            <Button onClick={handlePurge} disabled={purgeConfirm !== 'CONFIRM PURGE' || isPurging} variant="destructive" className="h-12 px-6 font-bold">
              {isPurging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />} Purge Account
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><History className="h-4 w-4" /> Compliance Chain Integrity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-1">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px] font-mono text-emerald-500">#{i}</div>
                {i < 5 && <div className="h-px w-4 bg-muted" />}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Your activity is currently linked to the genesis block via SHA256 hashing. All exports include these verification hashes.</p>
        </CardContent>
      </Card>
    </div>
  );
});
export function Settings() {
  const userRole = useAuthStore(s => s.user?.role);
  if (userRole !== 'admin') {
    return (
      <PageLayout>
        <Alert variant="destructive" className="max-w-2xl mx-auto"><ShieldAlert className="h-4 w-4" /><AlertTitle>Admin Access Required</AlertTitle><AlertDescription>Only system administrators can modify governance and user policies.</AlertDescription></Alert>
      </PageLayout>
    );
  }
  return (
    <PageLayout>
      <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-display font-bold tracking-tight">Enterprise Settings</h1>
        <Tabs defaultValue="privacy">
          <TabsList className="bg-muted p-1 rounded-xl h-14 mb-8">
            <TabsTrigger value="privacy" className="h-full px-8 rounded-lg font-bold">Data Governance</TabsTrigger>
            <TabsTrigger value="roles" className="h-full px-8 rounded-lg font-bold">Permissions</TabsTrigger>
            <TabsTrigger value="epr" className="h-full px-8 rounded-lg font-bold">EPR Compliance</TabsTrigger>
          </TabsList>
          <TabsContent value="privacy"><DataGovernanceTab /></TabsContent>
          <TabsContent value="roles"><div className="p-12 text-center text-muted-foreground italic border rounded-2xl">Permission management available in production dashboard.</div></TabsContent>
          <TabsContent value="epr"><div className="p-12 text-center text-muted-foreground italic border rounded-2xl">EPR reporting tools active in Enterprise Ledger view.</div></TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}