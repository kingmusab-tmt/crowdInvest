
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, ArrowDownLeft, DollarSign, PiggyBank, Briefcase } from "lucide-react";
import { getTransactions, Transaction, TransactionType, TransactionStatus } from "@/services/transactionService";
import { useToast } from "@/hooks/use-toast";

// In a real app, you would get the logged-in user's ID/email from an auth context
const LOGGED_IN_USER_EMAIL = "olivia.martin@email.com";

export default function UserTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const allTransactions = await getTransactions();
        const userTransactions = allTransactions.filter(t => t.userEmail === LOGGED_IN_USER_EMAIL);
        setTransactions(userTransactions);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        toast({
          title: "Error",
          description: "Failed to load your transaction history.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [toast]);


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
  
  const getTransactionDescription = (transaction: Transaction) => {
      switch (transaction.type) {
          case 'Deposit': return 'Card deposit via Monify';
          case 'Withdrawal': return `Request to ${transaction.userName}'s Bank`;
          case 'Investment': return `Investment in a community project`;
          case 'Profit Share': return `From a community investment`;
          case 'Assistance': return 'Financial assistance from community';
          default: return 'Transaction';
      }
  }

  return (
    <div>
        <div className="mb-6">
            <h1 className="text-3xl font-bold">My Transactions</h1>
            <p className="text-muted-foreground">A complete history of your financial activities.</p>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>An overview of all your deposits, withdrawals, and investments.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading your transactions...</TableCell>
                </TableRow>
              ) : transactions.map((transaction) => {
                const { variant, icon } = getTypeBadgeInfo(transaction.type);
                const isNegative = transaction.amount < 0;
                return (
                 <TableRow key={transaction.id}>
                    <TableCell>
                        <div className="font-medium">{getTransactionDescription(transaction)}</div>
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
                        {isNegative ? '' : '+'}${transaction.amount.toFixed(2)}
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
