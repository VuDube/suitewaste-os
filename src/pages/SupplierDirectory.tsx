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
import { Toaster, toast } from "sonner";
import { PlusCircle, Trash2, Search, Loader2, ShieldAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { PageLayout } from "@/components/PageLayout";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
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
      toast.success("Supplier created successfully!");
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to create supplier", { description: error.message });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api<{ id: string, deleted: boolean }>(`/api/suppliers/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: (data) => {
      if (data.deleted) {
        toast.success("Supplier deleted successfully!");
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      } else {
        toast.warning("Supplier not found or already deleted.");
      }
    },
    onError: (error) => {
      toast.error("Deletion Failed", { description: error.message });
    },
  });
  const { register, handleSubmit, reset } = useForm<SupplierFormData>();
  const onSubmit = (data: SupplierFormData) => {
    createMutation.mutate(data);
    reset();
  };
  const handleDelete = (id: string, name: string) => {
    if (!canManage) return;
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };
  const filteredSuppliers = (suppliers || []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.epr_number && s.epr_number.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.ceil(filteredSuppliers.length / PAGE_SIZE);
  const paginatedSuppliers = filteredSuppliers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  if (!canManage) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-destructive mb-2" />
          <h2 className="text-3xl font-bold tracking-tight">Access Denied</h2>
          <p className="text-muted-foreground text-lg">Management permissions required.</p>
        </div>
      </PageLayout>
    );
  }
  return (
    <PageLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground mt-1">Manage partner records and EPR compliance.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="h-14 px-8 text-lg font-semibold"><PlusCircle className="mr-2 h-5 w-5" /> Add Supplier</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Supplier</DialogTitle>
              <DialogDescription>Register supplier details for EPR compliance.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Supplier Name</Label>
                <Input placeholder="e.g., Jozi Scrap Metals" {...register("name", { required: true })} className="h-12" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input placeholder="Name" {...register("contact_person")} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input placeholder="011 ..." {...register("phone_number")} className="h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>EPR Number</Label>
                <Input placeholder="EPR123/ZA" {...register("epr_number")} className="h-12" />
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg bg-accent/5">
                <Checkbox id="weee_compliant" {...register("is_weee_compliant")} />
                <Label htmlFor="weee_compliant">WEEE Compliant</Label>
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full h-14 text-lg font-bold mt-2">
                {createMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Register Supplier"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:max-w-md h-14 pl-12 bg-card/50" />
      </div>
      <div className="overflow-x-auto border rounded-xl bg-card/80 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Name</TableHead>
              <TableHead>EPR Number</TableHead>
              <TableHead>Compliance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center h-48"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : paginatedSuppliers.length ? (
              paginatedSuppliers.map(s => (
                <TableRow key={s.id} className="group hover:bg-accent/50 transition-colors">
                  <TableCell className="font-bold text-base">{s.name}</TableCell>
                  <TableCell className="font-mono text-xs">{s.epr_number || 'PENDING'}</TableCell>
                  <TableCell>
                    {s.is_weee_compliant ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">WEEE Verified</Badge>
                    ) : (
                      <Badge variant="outline">Basic</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id, s.name)} disabled={deleteMutation.isPending}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} className="text-center h-48">No records found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Toaster richColors theme="dark" />
    </PageLayout>
  );
}