import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Transaction } from '@shared/types';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
export function Transactions() {
  const [search, setSearch] = useState('');
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api<Transaction[]>('/api/transactions'),
  });
  const filteredTransactions = useMemo(() => {
    return transactions
      ?.filter(t => t.id.toLowerCase().includes(search.toLowerCase()) || t.ledger_entry_id.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.transaction_timestamp - a.transaction_timestamp) || [];
  }, [transactions, search]);
  const exportToCSV = () => {
    const headers = ['ID', 'Ledger Entry ID', 'Amount', 'Currency', 'EPR Fee', 'Timestamp'];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.ledger_entry_id,
      t.amount,
      t.currency,
      t.epr_fee,
      format(new Date(t.transaction_timestamp), 'yyyy-MM-dd HH:mm:ss')
    ].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <PageLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <Button onClick={exportToCSV} disabled={!filteredTransactions || filteredTransactions.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
        <Card>
          <CardHeader>
            <Input 
              placeholder="Search by ID or Ledger ID..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Ledger Entry ID</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">EPR Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredTransactions.length > 0 ? (
                    filteredTransactions.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.id}</TableCell>
                        <TableCell className="font-mono text-xs">{t.ledger_entry_id}</TableCell>
                        <TableCell>{format(new Date(t.transaction_timestamp), 'PPpp')}</TableCell>
                        <TableCell className="text-right font-mono">{t.amount.toFixed(2)} {t.currency}</TableCell>
                        <TableCell className="text-right font-mono">{t.epr_fee.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">No transactions found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}