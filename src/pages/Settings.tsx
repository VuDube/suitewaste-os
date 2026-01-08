import React, { useState, useMemo, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/PageLayout';
import { api } from '@/lib/api-client';
import type { User, EPRReport, ConfigUserUpdate } from '@shared/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Download, Loader2, LogOut, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
const COLORS = ['#38761d', '#5a9a47', '#7cb870', '#a0d69a', '#c5f4c3', '#e7f9e6'];
const EPR_STREAMS = ['Plastic', 'Paper & Packaging', 'Glass', 'Metals', 'Electrical & Electronic', 'Other'] as const;
const UserRolesTable = memo(() => {
  const queryClient = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ['config-users'],
    queryFn: () => api<Omit<User, 'password_hash'>[]>('/api/config/users'),
  });
  const [userChanges, setUserChanges] = useState<Map<string, ConfigUserUpdate>>(new Map());
  const mutation = useMutation({
    mutationFn: (updates: ConfigUserUpdate[]) => api('/api/config/users', {
      method: 'POST',
      body: JSON.stringify(updates),
    }),
    onSuccess: () => {
      toast.success('Configurations saved');
      setUserChanges(new Map());
      queryClient.invalidateQueries({ queryKey: ['config-users'] });
    },
    onError: (e) => toast.error(e.message),
  });
  const handleFieldChange = (userId: string, field: keyof ConfigUserUpdate, value: any) => {
    const user = users?.find(u => u.id === userId);
    if (!user) return;
    setUserChanges(prev => {
      const next = new Map(prev);
      const curr = next.get(userId) || { id: userId, role: user.role, active: user.active, features: user.features || [] };
      (curr as any)[field] = value;
      next.set(userId, curr);
      return next;
    });
  };
  return (
    <Card className="bg-card/80 border-border backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Permissions</CardTitle>
          <p className="text-sm text-muted-foreground">Manage roles and feature access.</p>
        </div>
        <Button onClick={() => mutation.mutate(Array.from(userChanges.values()))} disabled={userChanges.size === 0 || mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Active</TableHead><TableHead>Features</TableHead></TableRow></TableHeader>
            <TableBody>
              {users?.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell>
                    <Select value={userChanges.get(u.id)?.role || u.role} onValueChange={v => handleFieldChange(u.id, 'role', v)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operator">Operator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="auditor">Auditor</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Switch checked={userChanges.get(u.id)?.active ?? u.active} onCheckedChange={v => handleFieldChange(u.id, 'active', v)} /></TableCell>
                  <TableCell><Input className="h-9" value={(userChanges.get(u.id)?.features || u.features || []).join(', ')} onChange={e => handleFieldChange(u.id, 'features', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
});
const EprReportingTab = memo(() => {
  const { data: report } = useQuery({ queryKey: ['epr-report'], queryFn: () => api<EPRReport>('/api/epr-report') });
  const streamData = useMemo(() => {
    if (!report || !report.streams) return [];
    return EPR_STREAMS.map(s => ({
      name: s,
      weight: (report.streams as any)[s]?.weight || 0,
      fees: (report.streams as any)[s]?.fees || 0
    })).filter(s => s.weight > 0);
  }, [report]);
  const handleDownloadAudit = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `epr_audit_${Date.now()}.json`;
    link.click();
    toast.success("Audit Exported");
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 bg-card/80 border-border">
        <CardHeader><CardTitle>Compliance Metrics</CardTitle></CardHeader>
        <CardContent className="space-y-8 py-6">
          <div className="text-center p-6 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="text-5xl font-bold text-primary">{report?.compliance_pct?.toFixed(1) ?? '0.0'}%</div>
            <p className="text-sm font-medium text-muted-foreground mt-2">Overall Compliance</p>
          </div>
          <div className="text-center p-6 bg-accent/5 rounded-2xl border border-accent/10">
            <div className="text-4xl font-bold">R {report?.total_fees?.toFixed(2) ?? '0.00'}</div>
            <p className="text-sm font-medium text-muted-foreground mt-2">Accrued EPR Fees</p>
          </div>
          <Button className="w-full h-14 text-lg font-semibold shadow-glow shadow-primary/20" onClick={handleDownloadAudit}>
            <Download className="mr-2 h-5 w-5" /> Export Audit Trail
          </Button>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2 bg-card/80 border-border">
        <CardHeader><CardTitle>Stream Distribution (kg)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={streamData} dataKey="weight" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {streamData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
const SecurityTab = memo(() => {
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const verifyMutation = useMutation({
    mutationFn: () => api('/api/audit/verify', { method: 'POST' }),
    onSuccess: (data: any) => {
      setVerifyResult(data);
      if (data.verified) toast.success("Integrity Verified");
      else toast.error("Tamper Detected");
    },
  });
  const clearMutation = useMutation({
    mutationFn: () => api('/api/admin/sessions/clear', { method: 'POST' }),
    onSuccess: (data: any) => toast.success(`Cleared ${data.cleared} sessions`),
  });
  return (
    <div className="space-y-6">
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Audit Integrity</CardTitle></CardHeader>
        <CardContent className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {verifyResult ? (verifyResult.verified ? "Chain Intact" : "Chain Broken") : "Verification Required"}
          </span>
          <Button size="sm" onClick={() => verifyMutation.mutate()} disabled={verifyMutation.isPending}>
            {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Now"}
          </Button>
        </CardContent>
      </Card>
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Danger Zone</CardTitle></CardHeader>
        <CardContent>
          <Button variant="destructive" className="w-full h-12" onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending}>
            Terminate All User Sessions
          </Button>
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
        <Alert variant="destructive"><ShieldAlert className="h-4 w-4" /><AlertTitle>Admin Access Required</AlertTitle></Alert>
      </PageLayout>
    );
  }
  return (
    <PageLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <h1 className="text-4xl font-display font-bold">Settings</h1>
        <Tabs defaultValue="roles">
          <TabsList className="bg-muted p-1 rounded-xl h-12">
            <TabsTrigger value="roles">Permissions</TabsTrigger>
            <TabsTrigger value="epr">EPR Compliance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          <TabsContent value="roles"><UserRolesTable /></TabsContent>
          <TabsContent value="epr"><EprReportingTab /></TabsContent>
          <TabsContent value="security"><SecurityTab /></TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}