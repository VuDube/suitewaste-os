import React, { useState, Suspense, useMemo, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/PageLayout';
import { api } from '@/lib/api-client';
import type { User, EPRReport, ConfigUserUpdate } from '@shared/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert, Download, Save, Loader2, Lock, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
const COLORS = ['#38761d', '#5a9a47', '#7cb870', '#a0d69a', '#c5f4c3', '#e7f9e6'];
const EPR_STREAMS = ['Plastic', 'Paper & Packaging', 'Glass', 'Metals', 'Electrical & Electronic', 'Other'];
const UserRolesTable = memo(() => {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
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
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Active</TableHead><TableHead>Features</TableHead></TableRow></TableHeader>
          <TableBody>
            {users?.map(u => (
              <TableRow key={u.id}>
                <TableCell>{u.username}</TableCell>
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
      </CardContent>
    </Card>
  );
});
const SecurityTab = memo(() => {
  const mutation = useMutation({
    mutationFn: () => api('/api/admin/sessions/clear', { method: 'POST' }),
    onSuccess: (data: any) => toast.success(`Cleared ${data.cleared} active sessions. All users logged out.`),
  });
  return (
    <div className="space-y-6">
      <Card className="bg-destructive/5 border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold">Logout All Users</h3>
              <p className="text-sm text-muted-foreground">Force immediate session invalidation for every active account across the system.</p>
            </div>
            <Button variant="destructive" className="h-12 px-6" onClick={() => { if(confirm("Are you sure? This will log out every single user immediately.")) mutation.mutate(); }}>
              <LogOut className="mr-2 h-4 w-4" /> Terminate All Sessions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
const EprReportingTab = memo(() => {
  const { data: report, isLoading } = useQuery({ queryKey: ['epr-report'], queryFn: () => api<EPRReport>('/api/epr-report') });
  const streamData = useMemo(() => {
    if (!report) return [];
    return EPR_STREAMS.map(s => ({ name: s, weight: report.streams[s]?.weight || 0, fees: report.streams[s]?.fees || 0 })).filter(s => s.weight > 0);
  }, [report]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle>Metrics</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center"><div className="text-4xl font-bold">{report?.compliance_pct.toFixed(1)}%</div><p className="text-sm text-muted-foreground">Compliance</p></div>
          <div className="text-center"><div className="text-4xl font-bold">R {report?.total_fees.toFixed(2)}</div><p className="text-sm text-muted-foreground">Total Fees</p></div>
          <Button className="w-full h-12" onClick={() => toast.success("Report export started")}><Download className="mr-2 h-4 w-4" /> Download Audit</Button>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Distribution</CardTitle></CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={streamData} dataKey="weight" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{streamData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
});
export function Settings() {
  const user = useAuthStore(s => s.user);
  if (user?.role !== 'admin') return <PageLayout><Alert variant="destructive"><ShieldAlert className="h-4 w-4" /><AlertTitle>Unauthorized</AlertTitle></Alert></PageLayout>;
  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-4xl font-display font-bold">System Settings</h1>
        <Tabs defaultValue="roles">
          <TabsList className="bg-muted p-1 rounded-lg"><TabsTrigger value="roles">Roles</TabsTrigger><TabsTrigger value="epr">EPR</TabsTrigger><TabsTrigger value="security">Security</TabsTrigger></TabsList>
          <TabsContent value="roles" className="mt-6"><UserRolesTable /></TabsContent>
          <TabsContent value="epr" className="mt-6"><EprReportingTab /></TabsContent>
          <TabsContent value="security" className="mt-6"><SecurityTab /></TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}