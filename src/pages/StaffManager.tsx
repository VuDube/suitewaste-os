import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/PageLayout';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { Users, Clock, LogIn, LogOut, ShieldAlert, PlusCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { StaffMember } from '@shared/types';
export function StaffManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => api<StaffMember[]>('/api/hr/staff'),
    enabled: !!user && (user.role === 'admin' || user.role === 'manager')
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<StaffMember> }) => 
      api<StaffMember>(`/api/hr/staff/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success("Staff record updated");
    }
  });
  const createMutation = useMutation({
    mutationFn: (newStaff: Omit<StaffMember, 'id' | 'last_seen'>) => 
      api<StaffMember>('/api/hr/staff', { method: 'POST', body: JSON.stringify(newStaff) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsAddOpen(false);
      toast.success("Staff member registered");
    }
  });
  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold tracking-tight">Manager Access Required</h2>
          <p className="text-muted-foreground mt-2">You do not have permissions to manage industrial personnel.</p>
        </div>
      </PageLayout>
    );
  }
  const handleToggleStatus = (member: StaffMember) => {
    updateMutation.mutate({ 
      id: member.id, 
      updates: { clock_status: member.clock_status === 'in' ? 'out' : 'in' } 
    });
  };
  return (
    <PageLayout>
      <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold tracking-tight">Staff Management</h1>
            <p className="text-muted-foreground mt-1 text-lg">Industrial roster and shift tracking.</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 px-8 text-lg font-bold shadow-glow shadow-primary/20">
                <PlusCircle className="mr-2 h-5 w-5" /> Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent aria-labelledby="add-staff-title" aria-describedby="add-staff-desc">
              <DialogHeader>
                <DialogTitle id="add-staff-title">Register New Personnel</DialogTitle>
                <DialogDescription id="add-staff-desc" className="text-muted-foreground">Provide employee details, secure PIN, and role for operational access and shift tracking.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4 pt-4" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const roleSelect = formData.get('role');
                createMutation.mutate({
                  name: formData.get('name') as string,
                  pin: formData.get('pin') as string,
                  role: (roleSelect && ['operator','clerk','driver','manager'].includes(roleSelect as any) ? roleSelect as any : 'operator') as 'operator'|'clerk'|'driver'|'manager',
                  clock_status: 'out'
                });
              }}>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input name="name" placeholder="e.g., Thabo Mbeki" required className="h-12" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Access PIN</Label>
                    <Input name="pin" type="password" placeholder="4 digits" required className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select name="role" defaultValue="operator" onValueChange={(value) => {
                      const select = document.querySelector('select[name="role"]') as HTMLSelectElement;
                      if (select) select.value = value;
                    }}>
                      <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operator">Operator</SelectItem>
                        <SelectItem value="clerk">Clerk</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 text-lg font-bold mt-2" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Register Personnel'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 shadow-soft bg-card/60 backdrop-blur-sm border-border">
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Staff Directory</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto border rounded-xl">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center h-48"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                    ) : staff?.map(s => (
                      <TableRow key={s.id} className="hover:bg-accent/5 transition-colors group">
                        <TableCell className="font-bold text-base">{s.name}</TableCell>
                        <TableCell className="capitalize font-medium text-muted-foreground">{s.role}</TableCell>
                        <TableCell>
                          <Badge variant={s.clock_status === 'in' ? 'default' : 'secondary'} className={s.clock_status === 'in' ? 'bg-emerald-600 font-bold' : 'font-bold'}>
                            {s.clock_status === 'in' ? 'Clocked In' : 'Clocked Out'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {s.last_seen ? format(s.last_seen, 'HH:mm:ss') : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="h-10 font-bold gap-2" onClick={() => handleToggleStatus(s)} disabled={updateMutation.isPending}>
                            {s.clock_status === 'in' ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                            {s.clock_status === 'in' ? 'Out' : 'In'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && staff?.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">No staff members registered.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-soft border-border">
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Shift Insights</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="text-sm font-bold text-primary uppercase tracking-wider mb-1">Morning Roster</div>
                <div className="text-xs text-muted-foreground font-medium">06:00 - 14:00 • 4 Active</div>
              </div>
              <div className="grid gap-2">
                <Button className="w-full h-12 font-bold justify-start" variant="ghost">View Overtime Logs</Button>
                <Button className="w-full h-12 font-bold justify-start" variant="ghost">Safety Certificates</Button>
                <Button className="w-full h-12 font-bold justify-start text-destructive hover:text-destructive hover:bg-destructive/5" variant="ghost">Incident Reports</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}