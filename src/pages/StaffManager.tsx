import React, { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Users, Clock, LogIn, LogOut, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
const MOCK_STAFF = [
  { id: 'st-001', name: 'Thabo Mbeki', role: 'operator', status: 'in', lastSeen: Date.now() },
  { id: 'st-002', name: 'Sarah Jacobs', role: 'driver', status: 'out', lastSeen: Date.now() - 3600000 },
  { id: 'st-003', name: 'Pieter Devries', role: 'manager', status: 'in', lastSeen: Date.now() },
];
export function StaffManager() {
  const { user } = useAuth();
  const [staff, setStaff] = useState(MOCK_STAFF);
  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold">Manager Access Required</h2>
        </div>
      </PageLayout>
    );
  }
  const toggleStatus = (id: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'in' ? 'out' : 'in', lastSeen: Date.now() } : s));
  };
  return (
    <PageLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">Industrial roster and shift tracking.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Staff Directory</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-bold">{s.name}</TableCell>
                      <TableCell className="capitalize">{s.role}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'in' ? 'default' : 'secondary'} className={s.status === 'in' ? 'bg-green-600' : ''}>
                          {s.status === 'in' ? 'Clocked In' : 'Clocked Out'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(s.lastSeen, 'HH:mm')}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => toggleStatus(s.id)}>
                          {s.status === 'in' ? <LogOut className="h-4 w-4 mr-1" /> : <LogIn className="h-4 w-4 mr-1" />}
                          {s.status === 'in' ? 'Out' : 'In'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Quick Roster</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="text-sm font-bold">Shift: Morning Production</div>
                <div className="text-xs text-muted-foreground">06:00 - 14:00</div>
              </div>
              <Button className="w-full h-12 font-bold" variant="outline">Schedule Leave</Button>
              <Button className="w-full h-12 font-bold" variant="outline">View Overtime Report</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}