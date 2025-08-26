
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, ArrowDownLeft, DollarSign, PiggyBank, Briefcase } from "lucide-react";

type TransactionType = "Deposit" | "Withdrawal" | "Investment" | "Profit Share" | "Assistance";
type TransactionStatus = "Completed" | "Pending" | "Failed";

type Transaction = {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  date: string;
  description: string;
};

// Mock data for the logged-in user
const initialTransactions: Transaction[] = [
  { id: "txn_1", type: "Deposit", status: "Completed", amount: 250.00, date: "2024-08-12", description: "Card deposit via Monify" },
  { id: "txn_4", type: "Profit Share", status: "Completed", amount: 123.45, date: "2024-08-09", description: "From 'GreenLeaf Organics' investment" },
  { id: "txn_7", type: "Investment", status: "Completed", amount: -500.00, date: "2024-08-05", description: "Investment in 'InnovateTech Solutions'" },
  { id: "txn_8", type: "Withdrawal", status: "Pending", amount: -75.00, date: "2024-08-13", description: "Request to Community Trust Bank" },
];


export default function UserTransactionsPage() {
  const [transactions] = useState<Transaction[]>(initialTransactions);

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
              {transactions.map((transaction) => {
                const { variant, icon } = getTypeBadgeInfo(transaction.type);
                const isNegative = transaction.amount < 0;
                return (
                 <TableRow key={transaction.id}>
                    <TableCell>
                        <div className="font-medium">{transaction.description}</div>
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
