import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Supplier } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Toaster, toast } from "sonner";
import { PlusCircle, Trash2, Search, Loader2, ShieldAlert, Award, UserCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { PageLayout } from "@/components/PageLayout";
import { useAuthStore } from "@/stores/useAuthStore";
type SupplierFormData = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
const PAGE_SIZE = 10;
export function SupplierDirectory() {
  const userRole = useAuthStore(s => s.user?.role);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const canManage = userRole === 'admin' || userRole === 'manager';
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api<Supplier[]>('/api/suppliers'),
  });
  const createMutation = useMutation({
    mutationFn: (newSupplier: SupplierFormData) => api<Supplier>('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(newSupplier),
    }),
    onSuccess: () => {
      toast.success("Supplier registered successfully!");
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDialogOpen(false);
    }
  });
  const { register, handleSubmit, reset } = useForm<SupplierFormData>();
  const onSubmit = (data: SupplierFormData) => {
    createMutation.mutate(data);
    reset();
  };
  const filteredSuppliers = (suppliers || []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.epr_number && s.epr_number.toLowerCase().includes(search.toLowerCase()))
  );
  const paginatedSuppliers = filteredSuppliers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight uppercase">Supplier Hub</h1>
            <p className="text-muted-foreground mt-1 text-lg">Manage partner records, EcoRewards, and SAPS verification.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 px-8 text-lg font-bold shadow-elevation-6 bg-primary">
                <PlusCircle className="mr-2 h-5 w-5" /> Register Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-3xl">
              <DialogHeader>
                <DialogTitle>New Industrial Partner</DialogTitle>
                <DialogDescription>Add supplier metadata for EPR/SAPS compliance.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input placeholder="Jozi Metals Ltd" {...register("name", { required: true })} className="h-12" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>EPR Number</Label>
                    <Input placeholder="EPR-ZA-001" {...register("epr_number")} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input placeholder="+27 ..." {...register("phone_number")} className="h-12" />
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-2xl bg-accent/5">
                  <Checkbox id="weee_compliant" {...register("is_weee_compliant")} />
                  <Label htmlFor="weee_compliant" className="font-bold">WEEE Compliant Vendor</Label>
                </div>
                <Button type="submit" disabled={createMutation.isPending} className="w-full h-14 text-lg font-black uppercase mt-2">
                  {createMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Save Profile"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search supplier directory..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:max-w-md h-14 pl-12 bg-card/50 rounded-2xl border-none shadow-elevation-1" />
        </div>
        <div className="overflow-x-auto border-none rounded-3xl bg-card/80 backdrop-blur-sm shadow-elevation-3">
          <Table>
            <TableHeader className="bg-surface-variant/30 h-14">
              <TableRow>
                <TableHead className="px-6 text-[10px] font-black uppercase">Vendor Name</TableHead>
                <TableHead className="px-6 text-[10px] font-black uppercase">EcoPoints</TableHead>
                <TableHead className="px-6 text-[10px] font-black uppercase">Compliance</TableHead>
                <TableHead className="px-6 text-[10px] font-black uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center h-48"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : paginatedSuppliers.length ? (
                paginatedSuppliers.map(s => (
                  <TableRow key={s.id} className="group hover:bg-primary/5 transition-colors border-b-white/5">
                    <TableCell className="px-6 py-5">
                      <div className="font-black text-base">{s.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{s.epr_number || 'PENDING'}</div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        <span className="font-black text-primary">{(s.total_rewards || 0).toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex gap-2">
                        {s.is_weee_compliant && <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[9px]">WEEE</Badge>}
                        <Badge variant="outline" className="text-[9px] flex gap-1 items-center"><UserCheck className="h-3 w-3" /> SAPS VERIFIED</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right">
                      {canManage && (
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="text-center h-48 italic text-muted-foreground">No matching partners found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <Toaster richColors theme="dark" />
    </PageLayout>
  );
}