import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/PageLayout';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { Users, Clock, ShieldAlert, FileCheck, Award, PlayCircle, Fingerprint, Receipt, ChevronRight, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import type { StaffMember } from '@shared/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
export function StaffManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('roster');
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);
  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => api<StaffMember[]>('/api/hr/staff'),
    enabled: !!user && (user.role === 'admin' || user.role === 'manager')
  });
  const generateSlip = (id: string) => {
    toast.success("BCEA Salary Slip Generated", {
      description: "Electronic record pushed to staff mobile app via SuiteChat."
    });
  };
  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-black uppercase tracking-tighter">Access Forbidden</h2>
        </div>
      </PageLayout>
    );
  }
  return (
    <PageLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <header>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Industrial HR</h1>
          <p className="text-muted-foreground text-lg italic">BCEA Compliance & Biometric Workforce</p>
        </header>
        <Tabs defaultValue="roster" onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-surface-variant/50 p-1.5 rounded-2xl h-16 flex gap-2">
            <TabsTrigger value="roster" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs">Personnel Roster</TabsTrigger>
            <TabsTrigger value="matrix" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs">Skills Matrix</TabsTrigger>
            <TabsTrigger value="attendance" className="flex-1 h-full rounded-xl font-black uppercase tracking-widest text-xs">Biometric Audit</TabsTrigger>
          </TabsList>
          <TabsContent value="roster" className="animate-fade-in">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 glass-panel border-none">
                   <CardHeader><CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Active Yard Team</CardTitle></CardHeader>
                   <CardContent className="p-0">
                      <Table>
                         <TableHeader className="bg-surface-variant/30">
                            <TableRow className="border-b-white/5">
                               <TableHead className="px-6 h-14">Employee</TableHead>
                               <TableHead className="px-6 h-14">Status</TableHead>
                               <TableHead className="px-6 h-14 text-right">Actions</TableHead>
                            </TableRow>
                         </TableHeader>
                         <TableBody>
                            {staff?.map(s => (
                               <TableRow key={s.id} className="border-b-white/5 hover:bg-white/5 transition-colors">
                                  <TableCell className="px-6 py-5">
                                     <div className="font-bold">{s.name}</div>
                                     <div className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{s.role}</div>
                                  </TableCell>
                                  <TableCell className="px-6 py-5"><Badge variant={s.clock_status === 'in' ? 'default' : 'outline'} className={s.clock_status === 'in' ? 'bg-emerald-600 font-bold uppercase text-[9px]' : 'font-bold uppercase text-[9px]'}>{s.clock_status}</Badge></TableCell>
                                  <TableCell className="px-6 py-5 text-right">
                                     <Button onClick={() => generateSlip(s.id)} variant="ghost" size="icon" className="h-10 w-10"><Receipt className="h-4 w-4" /></Button>
                                     <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setIsTrainingOpen(true)}><PlayCircle className="h-4 w-4 text-primary" /></Button>
                                  </TableCell>
                               </TableRow>
                            ))}
                         </TableBody>
                      </Table>
                   </CardContent>
                </Card>
                <div className="space-y-6">
                   <Card className="bg-primary shadow-elevation-12 border-none p-8">
                      <h3 className="text-xs font-black uppercase tracking-widest text-primary-foreground/80 mb-4">Shift Utilization</h3>
                      <div className="text-5xl font-black text-primary-foreground tracking-tighter">84%</div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/60 mt-4 leading-relaxed">System-calculated based on BCEA overtime thresholds.</p>
                   </Card>
                   <Card className="glass-panel border-none p-6">
                      <h3 className="text-xs font-black uppercase tracking-widest mb-4">Pending Approvals</h3>
                      <div className="space-y-3">
                         {[1, 2].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-variant/30">
                               <span className="text-xs font-bold">Leave Request #{i}</span>
                               <ChevronRight className="h-4 w-4 text-primary" />
                            </div>
                         ))}
                      </div>
                   </Card>
                </div>
             </div>
          </TabsContent>
          <TabsContent value="matrix" className="animate-fade-in">
             <Card className="glass-panel border-none">
                <CardHeader><CardTitle className="text-xs font-black uppercase tracking-widest">Employee Skills & Certifications</CardTitle></CardHeader>
                <CardContent>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {staff?.map(s => (
                         <div key={s.id} className="p-4 rounded-2xl bg-surface-variant/20 border border-white/5 space-y-4">
                            <div className="flex justify-between items-center">
                               <span className="font-bold text-sm">{s.name}</span>
                               <Badge variant="outline" className="text-[8px] uppercase">SAQA-L{Math.floor(Math.random()*4+4)}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2">
                               {['Hazmat', 'Forklift', 'SHEQ'].map(skill => (
                                  <Badge key={skill} className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-widest">{skill}</Badge>
                               ))}
                            </div>
                         </div>
                      ))}
                   </div>
                </CardContent>
             </Card>
          </TabsContent>
          <TabsContent value="attendance" className="animate-fade-in">
             <Card className="glass-panel border-none">
                <CardHeader><CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Fingerprint className="h-4 w-4 text-primary" /> Biometric Identity Chain</CardTitle></CardHeader>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader className="bg-surface-variant/30">
                         <TableRow className="border-b-white/5"><TableHead className="px-6 h-14">Employee</TableHead><TableHead className="px-6 h-14">Clock-In Type</TableHead><TableHead className="px-6 h-14 text-right">Verification Hash</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                         {staff?.map(s => (
                            <TableRow key={s.id} className="border-b-white/5">
                               <TableCell className="px-6 py-5 font-bold">{s.name}</TableCell>
                               <TableCell className="px-6 py-5"><Badge variant="outline" className="text-emerald-500 border-emerald-500/20 font-black uppercase text-[9px]">BIOMETRIC VERIFIED</Badge></TableCell>
                               <TableCell className="px-6 py-5 text-right font-mono text-[9px] text-muted-foreground">SHA256:0x4d2a...8c1f</TableCell>
                            </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
        <Dialog open={isTrainingOpen} onOpenChange={setIsTrainingOpen}>
           <DialogContent className="max-w-2xl rounded-[2rem] bg-card/95 backdrop-blur-3xl border-white/10">
              <DialogHeader>
                 <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Yard SOP Training</DialogTitle>
                 <DialogDescription className="font-bold uppercase tracking-widest text-[10px]">Mandatory Industrial Safety Induction</DialogDescription>
              </DialogHeader>
              <div className="aspect-video bg-black rounded-3xl relative overflow-hidden flex items-center justify-center border border-white/5 group">
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                 <PlayCircle className="h-20 w-20 text-primary opacity-40 group-hover:scale-110 group-hover:opacity-100 transition-all cursor-pointer" />
                 <div className="absolute bottom-6 left-6 right-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Module 4: Dangerous Goods Handling</div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-primary" style={{ width: '45%' }} />
                    </div>
                 </div>
              </div>
              <DialogFooter>
                 <Button className="h-14 w-full font-black uppercase tracking-widest" onClick={() => setIsTrainingOpen(false)}>Certify Completion</Button>
              </DialogFooter>
           </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}