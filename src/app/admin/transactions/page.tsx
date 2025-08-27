
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, ArrowUpRight, ArrowDownLeft, DollarSign, PiggyBank, Briefcase } from "lucide-react";
import { getTransactions, Transaction, TransactionType, TransactionStatus } from "@/services/transactionService";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const fetchedTransactions = await getTransactions();
        setTransactions(fetchedTransactions);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        toast({
          title: "Error",
          description: "Failed to load transaction data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [toast]);

  const handleExport = () => {
    toast({
      title: "Exporting Transactions",
      description: "A CSV file of all transactions is being generated.",
    });
    // In a real application, you would implement the CSV export logic here.
  };
  
  const getTypeBadgeInfo = (type: TransactionType) => {
    switch (type) {
      case 'Deposit': return { variant: 'secondary', icon: <ArrowUpRight className="h-3 w-3 text-green-500" /> };
      case 'Withdrawal': return { variant: 'secondary', icon: <ArrowDownLeft className="h-3 w-3 text-red-500" /> };
      case 'Investment': return { variant: 'outline', icon: <Briefcase className="h-3 w-3" /> };
      case 'Profit Share': return { variant: 'outline', icon: <DollarSign className="h-3 w-3 text-emerald-500" /> };
      case 'Assistance': return { variant: 'outline', icon: <PiggyBank className="h-3 w-3 text-amber-500" /> };
      default: return { variant: 'outline', icon: null };
    }
  }
  
  const getStatusBadgeVariant = (status: TransactionStatus) => {
    switch (status) {
        case 'Completed': return 'secondary';
        case 'Failed': return 'destructive';
        default: return 'outline';
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">All Transactions</h1>
          <p className="text-muted-foreground">A complete history of all financial activities.</p>
        </div>
        <Button onClick={handleExport}>
          <FileDown className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Browse and manage all transactions in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading transactions...</TableCell>
                </TableRow>
              ) : transactions.map((transaction) => {
                const { variant, icon } = getTypeBadgeInfo(transaction.type);
                const isNegative = transaction.amount < 0;
                return (
                 <TableRow key={transaction.id}>
                    <TableCell>
                        <div className="font-medium">{transaction.userName}</div>
                        <div className="text-sm text-muted-foreground">{transaction.userEmail}</div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={variant} className="gap-1">
                            {icon}
                            {transaction.type}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={getStatusBadgeVariant(transaction.status)}>{transaction.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell className={`text-right font-mono ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                        {isNegative ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                    </TableCell>
                </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
