
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, CheckCircle, XCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type RequestStatus = "Pending" | "Approved" | "Rejected";

type AssistanceRequest = {
  id: number;
  userName: string;
  userEmail: string;
  community: string;
  purpose: string;
  amount: number;
  returnDate: string;
  status: RequestStatus;
};

const initialRequests: AssistanceRequest[] = [
  {
    id: 1,
    userName: "Olivia Martin",
    userEmail: "olivia.martin@email.com",
    community: "Northside",
    purpose: "Business",
    amount: 1500,
    returnDate: "2025-06-30",
    status: "Pending",
  },
  {
    id: 2,
    userName: "Liam Johnson",
    userEmail: "liam@example.com",
    community: "Northside",
    purpose: "Health Emergency",
    amount: 750,
    returnDate: "2025-01-15",
    status: "Approved",
  },
  {
    id: 3,
    userName: "Ethan Jones",
    userEmail: "ethan.jones@email.com",
    community: "Southside",
    purpose: "Education",
    amount: 2000,
    returnDate: "2026-08-01",
    status: "Rejected",
  },
];

export default function AdminAssistancePage() {
  const [requests, setRequests] = useState<AssistanceRequest[]>(initialRequests);
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
      description: `${requestToUpdate.userName}'s request has been ${newStatus.toLowerCase()}.`,
    });
  };

  const getStatusBadgeVariant = (status: RequestStatus) => {
    switch (status) {
        case 'Approved': return 'secondary';
        case 'Rejected': return 'destructive';
        default: return 'outline';
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Financial Assistance Requests</h1>
        <p className="text-muted-foreground">Review and manage financial assistance requests from community members.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>A list of all financial assistance requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Community</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Return Date</TableHead>
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
                  <TableCell>{request.community}</TableCell>
                  <TableCell>{request.purpose}</TableCell>
                  <TableCell className="text-right font-mono">${request.amount.toFixed(2)}</TableCell>
                  <TableCell>{new Date(request.returnDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={request.status !== 'Pending'}>
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'Approved')}>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'Rejected')}>
                          <XCircle className="mr-2 h-4 w-4 text-red-500" />
                          Reject
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
