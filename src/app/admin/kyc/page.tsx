
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle } from "lucide-react";
import { getKycRequests, updateKycRequest, KycInfo, KycStatus } from "@/services/kycService";

export default function AdminKycPage() {
  const [requests, setRequests] = useState<KycInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Fetch only pending requests for the review queue
        const fetchedRequests = await getKycRequests("Pending");
        setRequests(fetchedRequests);
      } catch (error) {
        console.error("Failed to fetch KYC requests:", error);
        toast({
          title: "Error",
          description: "Failed to load KYC submission data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [toast]);

  const handleStatusChange = async (kycId: string, newStatus: KycStatus) => {
    const requestToUpdate = requests.find(r => r.id === kycId);
    if (!requestToUpdate) return;
    
    try {
      await updateKycRequest(kycId, { status: newStatus });
      // Remove the request from the list after it's been actioned
      setRequests(requests.filter((request) => request.id !== kycId));
      toast({
        title: `KYC Submission ${newStatus}`,
        description: `${requestToUpdate.userName}'s KYC has been ${newStatus.toLowerCase()}.`,
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update KYC status.", variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">KYC Verification</h1>
        <p className="text-muted-foreground">Review and verify user-submitted identification numbers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Submissions</CardTitle>
          <CardDescription>A list of all user KYC submissions awaiting verification.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>BVN</TableHead>
                <TableHead>NIN</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading submissions...</TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                 <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No pending KYC submissions.</TableCell>
                </TableRow>
              ) : requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="font-medium">{request.userName}</div>
                  </TableCell>
                  <TableCell className="font-mono">{request.bvn}</TableCell>
                  <TableCell className="font-mono">{request.nin}</TableCell>
                  <TableCell>{new Date(request.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleStatusChange(request.id, 'Verified')}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Approve
                    </Button>
                     <Button variant="outline" size="sm" onClick={() => handleStatusChange(request.id, 'Rejected')}>
                        <XCircle className="mr-2 h-4 w-4 text-red-500" />
                        Reject
                    </Button>
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
