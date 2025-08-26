
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, CheckCircle, Clock, Truck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

type RequestStatus = "Pending" | "Approved" | "Initiated" | "Completed";

type WithdrawalRequest = {
  id: number;
  userName: string;
  userEmail: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  status: RequestStatus;
  requestDate: string;
};

const initialRequests: WithdrawalRequest[] = [
  {
    id: 1,
    userName: "Olivia Martin",
    userEmail: "olivia.martin@email.com",
    amount: 123.45,
    bankName: "Community Trust Bank",
    accountNumber: "0123456789",
    status: "Pending",
    requestDate: "2024-08-10",
  },
  {
    id: 2,
    userName: "Noah Williams",
    userEmail: "noah@example.com",
    amount: 50.00,
    bankName: "First National",
    accountNumber: "9876543210",
    status: "Approved",
    requestDate: "2024-08-09",
  },
  {
    id: 3,
    userName: "Jackson Lee",
    userEmail: "jackson.lee@email.com",
    amount: 250.00,
    bankName: "Community Trust Bank",
    accountNumber: "5551234567",
    status: "Completed",
    requestDate: "2024-08-05",
  },
];

export default function AdminWithdrawalsPage() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>(initialRequests);
  const { toast } = useToast();

  const handleStatusChange = (requestId: number, newStatus: RequestStatus) => {
    const requestToUpdate = requests.find(r => r.id === requestId);
    if (!requestToUpdate) return;
    
    setRequests(
      requests.map((request) =>
        request.id === requestId ? { ...request, status: newStatus } : request
      )
    );
    
    toast({
      title: `Request ${newStatus}`,
      description: `${requestToUpdate.userName}'s withdrawal has been marked as ${newStatus.toLowerCase()}.`,
    });
  };

  const getStatusBadgeVariant = (status: RequestStatus) => {
    switch (status) {
        case 'Completed': return 'secondary';
        case 'Approved': return 'default';
        case 'Initiated': return 'outline';
        default: return 'outline';
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Withdrawal Requests</h1>
        <p className="text-muted-foreground">Review and process withdrawal requests from community members.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>A list of all profit withdrawal requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Bank Details</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="font-medium">{request.userName}</div>
                    <div className="text-sm text-muted-foreground">{request.userEmail}</div>
                  </TableCell>
                   <TableCell>
                    <div className="font-medium">{request.bankName}</div>
                    <div className="text-sm text-muted-foreground font-mono">{request.accountNumber}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono">${request.amount.toFixed(2)}</TableCell>
                  <TableCell>{new Date(request.requestDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={request.status === 'Completed'}>
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'Approved')} disabled={request.status === 'Approved' || request.status === 'Initiated'}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'Initiated')} disabled={request.status === 'Initiated'}>
                          <Clock className="mr-2 h-4 w-4" />
                          Mark as Initiated
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'Completed')}>
                          <Truck className="mr-2 h-4 w-4" />
                           Mark as Completed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
