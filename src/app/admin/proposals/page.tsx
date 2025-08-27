
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, PlusCircle, Send, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getProposals, createProposal, deleteProposal, Proposal, ProposalStatus } from "@/services/proposalService";
import { getUsers } from "@/services/userService";

function ProposalsPageContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNewProposalDialogOpen, setIsNewProposalDialogOpen] = useState(false);
    const [totalMembers, setTotalMembers] = useState(0);
    
    // State for pre-filled data
    const [prefilledTitle, setPrefilledTitle] = useState(searchParams.get('title') || "");
    const [prefilledShortDesc, setPrefilledShortDesc] = useState(searchParams.get('shortDescription') || "");
    const [prefilledLongDesc, setPrefilledLongDesc] = useState(searchParams.get('longDescription') || "");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [fetchedProposals, fetchedUsers] = await Promise.all([
                    getProposals(),
                    getUsers(),
                ]);
                setProposals(fetchedProposals);
                setTotalMembers(fetchedUsers.length);
            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast({ title: "Error", description: "Failed to load proposals or user data.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        
        // If query params exist, open the dialog
        if (searchParams.get('title')) {
            setIsNewProposalDialogOpen(true);
        }
    }, [toast, searchParams]);

    async function handleCreateProposal(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        
        const newProposalData: Omit<Proposal, 'id'> = {
            title: formData.get('title') as string,
            description: formData.get('short-description') as string,
            longDescription: formData.get('long-description') as string,
            status: 'Active',
            acceptedVotes: 0,
            rejectedVotes: 0,
            totalMembers: totalMembers,
        };

        try {
            const newProposal = await createProposal(newProposalData);
            setProposals([newProposal, ...proposals]);
            setIsNewProposalDialogOpen(false);
            // Clear pre-filled state after submission
            setPrefilledTitle("");
            setPrefilledShortDesc("");
            setPrefilledLongDesc("");
            toast({
                title: "Proposal Created",
                description: `The proposal "${newProposal.title}" is now active for voting.`,
            });
        } catch (error) {
            toast({ title: "Error", description: "Failed to create proposal.", variant: "destructive" });
        }
    }

    async function handleDeleteProposal(proposalId: string) {
        const proposalToDelete = proposals.find(p => p.id === proposalId);
        if (!proposalToDelete) return;

        try {
            await deleteProposal(proposalId);
            setProposals(proposals.filter(p => p.id !== proposalId));
            toast({ title: "Proposal Deleted", description: `"${proposalToDelete.title}" has been deleted.`, variant: "destructive" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete proposal.", variant: "destructive" });
        }
    }
    
    const getStatusBadgeVariant = (status: ProposalStatus) => {
        switch (status) {
            case "Passed": return "secondary";
            case "Failed": return "destructive";
            default: return "default";
        }
    };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Proposal Management</h1>
          <p className="text-muted-foreground">
            Create and manage proposals for the community to vote on.
          </p>
        </div>
        <Dialog open={isNewProposalDialogOpen} onOpenChange={setIsNewProposalDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Proposal
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Create New Proposal</DialogTitle>
                    <DialogDescription>
                        Fill out the form below. Once submitted, it will be visible to all community members for voting.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProposal}>
                    <CardContent className="space-y-6 p-0 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Proposal Title</Label>
                            <Input id="title" name="title" placeholder="e.g., Invest in 'Olivia's Artisan Bakery'?" required defaultValue={prefilledTitle}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="short-description">Short Description</Label>
                            <Textarea id="short-description" name="short-description" placeholder="A brief one-sentence summary of the proposal." required rows={2} defaultValue={prefilledShortDesc}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="long-description">Full Description</Label>
                            <Textarea id="long-description" name="long-description" placeholder="Provide a detailed description of the proposal." required rows={6} defaultValue={prefilledLongDesc}/>
                        </div>
                    </CardContent>
                    <DialogFooter className="pt-6">
                        <Button className="w-full" type="submit">
                            <Send className="mr-2 h-4 w-4" />
                            Create and Publish Proposal
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle>All Proposals</CardTitle>
              <CardDescription>A list of all proposals in the system.</CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead className="text-center">Votes (Yes/No)</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {loading ? (
                          <TableRow><TableCell colSpan={4} className="text-center">Loading proposals...</TableCell></TableRow>
                      ) : proposals.map(proposal => (
                          <TableRow key={proposal.id}>
                              <TableCell className="font-medium">{proposal.title}</TableCell>
                              <TableCell className="text-center">{proposal.acceptedVotes} / {proposal.rejectedVotes}</TableCell>
                              <TableCell className="text-center">
                                  <Badge variant={getStatusBadgeVariant(proposal.status)}>{proposal.status}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProposal(proposal.id)}>
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Delete
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

// Wrap the component in a Suspense boundary to use searchParams
export default function AdminProposalsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProposalsPageContent />
        </Suspense>
    );
}
