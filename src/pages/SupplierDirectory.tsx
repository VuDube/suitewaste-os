import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Supplier } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Toaster, toast } from "sonner";
import { PlusCircle, Trash2, Search, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { PageLayout } from "@/components/PageLayout";
type SupplierFormData = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
export function SupplierDirectory() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setDialogOpen] = useState(false);
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
      toast.error("Failed to delete supplier", { description: error.message });
    },
  });
  const { register, handleSubmit, reset } = useForm<SupplierFormData>();
  const onSubmit = (data: SupplierFormData) => {
    createMutation.mutate(data);
    reset();
  };
  const filteredSuppliers = suppliers?.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <PageLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Supplier Directory</h1>
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Supplier</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Supplier</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input placeholder="Supplier Name" {...register("name", { required: true })} />
              <Input placeholder="Contact Person" {...register("contact_person")} />
              <Input placeholder="Phone Number" {...register("phone_number")} />
              <Input placeholder="Email" type="email" {...register("email")} />
              <Input placeholder="EPR Number" {...register("epr_number")} />
              <div className="flex items-center space-x-2">
                <Checkbox id="weee_compliant" {...register("is_weee_compliant")} />
                <Label htmlFor="weee_compliant">WEEE Compliant</Label>
              </div>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Supplier
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>EPR Number</TableHead>
              <TableHead>WEEE Compliant</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
            ) : filteredSuppliers?.length ? (
              filteredSuppliers.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.epr_number || 'N/A'}</TableCell>
                  <TableCell>{s.is_weee_compliant ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{s.contact_person || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)} disabled={deleteMutation.isPending && deleteMutation.variables === s.id}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={5} className="text-center">No suppliers found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Toaster richColors theme="dark" />
    </PageLayout>
  );
}