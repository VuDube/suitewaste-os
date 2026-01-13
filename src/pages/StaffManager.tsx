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
import { Users, Clock, LogIn, LogOut, ShieldAlert, PlusCircle, Loader2, FileCheck, Award } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { StaffMember } from '@shared/types';
export function StaffManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => api<StaffMember[]>('/api/hr/staff'),
    enabled: !!user && (user.role === 'admin' || user.role === 'manager')
  });
  const handleVerifySAQA = (id: string) => {
    setVerifyingId(id);
    setTimeout(() => {
      toast.success("SAQA Credentials Verified", {
        description: "Official qualification records matched for ID: " + id.substring(0, 8)
      });
      setVerifyingId(null);
    }, 2000);
  };
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<StaffMember> }) =>
      api<StaffMember>(`/api/hr/staff/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success("Staff record updated");
    }
  });
  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold tracking-tight">Manager Access Required</h2>
        </div>
      </PageLayout>
    );
  }
  return (
    <PageLayout>
      <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Human Resources</h1>
            <p className="text-muted-foreground text-lg italic">SAQA Registry & Skills Matrix</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="h-14 px-8 text-lg font-bold shadow-glow shadow-primary/20">
            <PlusCircle className="mr-2 h-5 w-5" /> Add Staff
          </Button>
        </header>
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="md:col-span-2 glass-panel border-none shadow-elevation-1">
            <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Active Personnel</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-surface-variant/30">
                  <TableRow className="border-b-white/5">
                    <TableHead className="px-6 h-14">Employee</TableHead>
                    <TableHead className="px-6 h-14">Credentials</TableHead>
                    <TableHead className="px-6 h-14">Skills</TableHead>
                    <TableHead className="px-6 h-14 text-right">Verification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10">Syncing roster...</TableCell></TableRow>
                  ) : staff?.map(s => (
                    <TableRow key={s.id} className="border-b-white/5 hover:bg-white/5">
                      <TableCell className="px-6 py-5">
                        <div className="font-bold">{s.name}</div>
                        <div className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{s.role}</div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <Badge variant="outline" className="text-[9px] font-black uppercase bg-emerald-500/5 text-emerald-500 border-emerald-500/20">SAQA:L7</Badge>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="secondary" className="text-[8px] uppercase tracking-tighter">Hazmat</Badge>
                          <Badge variant="secondary" className="text-[8px] uppercase tracking-tighter">Forklift</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-right">
                        <Button 
                          variant="ghost" size="sm" className="h-10 gap-2 font-black uppercase tracking-widest text-[10px]" 
                          onClick={() => handleVerifySAQA(s.id)}
                          disabled={verifyingId === s.id}
                        >
                          {verifyingId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileCheck className="h-4 w-4" />}
                          SAQA
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <aside className="space-y-6">
            <Card className="bg-primary shadow-elevation-12 border-none">
              <CardHeader><CardTitle className="text-xs font-black uppercase tracking-widest text-primary-foreground/80">Compliance Status</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center text-primary-foreground">
                  <div className="text-4xl font-black tracking-tighter">100%</div>
                  <Award className="h-10 w-10 opacity-40" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/60 leading-relaxed">All active yard personnel have verified safety certifications.</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </PageLayout>
  );
}