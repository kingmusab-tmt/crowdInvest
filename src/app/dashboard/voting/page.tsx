
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Check, Info, ThumbsDown, ThumbsUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getProposals, updateProposal, Proposal, ProposalStatus } from "@/services/proposalService";
import { Skeleton } from "@/components/ui/skeleton";

type UserVote = "Accepted" | "Rejected" | null;
type ProposalWithVote = Proposal & { userVote: UserVote };

export default function VotingPage() {
  const [proposals, setProposals] = useState<ProposalWithVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<ProposalWithVote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const fetchedProposals = await getProposals();
        // In a real app, user's vote would be stored per-user. We'll simulate it client-side.
        setProposals(fetchedProposals.map(p => ({ ...p, userVote: null })));
      } catch (error) {
        toast({ title: "Error", description: "Failed to load proposals.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchProposals();
  }, [toast]);


  const handleViewDetails = (proposal: ProposalWithVote) => {
    setSelectedProposal(proposal);
    setIsModalOpen(true);
  };

  const handleVote = async (vote: 'Accepted' | 'Rejected') => {
    if (!selectedProposal) return;
    
    const updatedProposalData = {
        acceptedVotes: vote === 'Accepted' ? selectedProposal.acceptedVotes + 1 : selectedProposal.acceptedVotes,
        rejectedVotes: vote === 'Rejected' ? selectedProposal.rejectedVotes + 1 : selectedProposal.rejectedVotes,
    };
    
    try {
        await updateProposal(selectedProposal.id, updatedProposalData);
        
        const updatedProposals = proposals.map((p) => {
          if (p.id === selectedProposal.id) {
            return { ...p, ...updatedProposalData, userVote: vote };
          }
          return p;
        });

        setProposals(updatedProposals);
        setIsModalOpen(false);
        toast({
          title: "Vote Cast!",
          description: `You have successfully voted to ${vote.toLowerCase()} the proposal.`,
        });
    } catch (error) {
        toast({ title: "Error", description: "Failed to cast your vote.", variant: "destructive" });
    }
  };

  const getStatusBadgeVariant = (status: ProposalStatus) => {
    switch (status) {
      case "Passed": return "secondary";
      case "Failed": return "destructive";
      default: return "default";
    }
  };

  if (loading) {
      return (
          <div>
            <div className="mb-6"><Skeleton className="h-9 w-1/3"/><Skeleton className="h-5 w-2/3 mt-2"/></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4 mb-2"/><Skeleton className="h-5 w-full"/></CardHeader><CardContent className="space-y-4"><Skeleton className="h-12 w-full"/><Skeleton className="h-8 w-full"/></CardContent><CardFooter><Skeleton className="h-10 w-full"/></CardFooter></Card>
                ))}
            </div>
          </div>
      );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Community Voting</h1>
        <p className="text-muted-foreground">
          Make your voice heard. Participate in important community decisions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {proposals.map((proposal) => {
          const totalVotes = proposal.acceptedVotes + proposal.rejectedVotes;
          const acceptedPercentage = totalVotes > 0 ? (proposal.acceptedVotes / totalVotes) * 100 : 0;
          const rejectedPercentage = totalVotes > 0 ? (proposal.rejectedVotes / totalVotes) * 100 : 0;
          const turnoutPercentage = (totalVotes / proposal.totalMembers) * 100;
          
          return (
            <Card key={proposal.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="mb-2">{proposal.title}</CardTitle>
                  <Badge variant={getStatusBadgeVariant(proposal.status)}>{proposal.status}</Badge>
                </div>
                <CardDescription>{proposal.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="flex items-center text-green-600 font-medium"><ThumbsUp className="mr-1 h-4 w-4" /> Accepted: {proposal.acceptedVotes}</span>
                    <span className="flex items-center text-red-600 font-medium"><ThumbsDown className="mr-1 h-4 w-4" /> Rejected: {proposal.rejectedVotes}</span>
                  </div>
                  <div className="flex gap-1">
                     <Progress value={acceptedPercentage} className="h-2 [&>div]:bg-green-500" />
                     <Progress value={rejectedPercentage} className="h-2 [&>div]:bg-red-500" />
                  </div>
                </div>
                 <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Turnout</span>
                        <span>{turnoutPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={turnoutPercentage} className="h-2" />
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2">
                 {proposal.userVote && (
                    <Alert className="w-full">
                        <Check className="h-4 w-4" />
                        <AlertTitle>You Voted</AlertTitle>
                        <AlertDescription>
                            You voted <span className="font-semibold">{proposal.userVote}</span> on this proposal.
                        </AlertDescription>
                    </Alert>
                 )}
                <Button variant="outline" className="w-full" onClick={() => handleViewDetails(proposal)}>
                  View Details & Vote
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
            {selectedProposal && (
                <>
                    <DialogHeader>
                        <DialogTitle className="text-2xl">{selectedProposal.title}</DialogTitle>
                        <DialogDescription>{selectedProposal.longDescription}</DialogDescription>
                    </DialogHeader>
                    
                    {selectedProposal.status === 'Active' ? (
                         selectedProposal.userVote === null ? (
                            <DialogFooter className="sm:justify-between flex-col sm:flex-row gap-2">
                                <Button className="w-full sm:w-auto" variant="destructive" onClick={() => handleVote('Rejected')}>
                                    <ThumbsDown className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                                <Button className="w-full sm:w-auto" onClick={() => handleVote('Accepted')}>
                                    <ThumbsUp className="mr-2 h-4 w-4" />
                                    Accept
                                </Button>
                            </DialogFooter>
                         ) : (
                             <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>You have already voted</AlertTitle>
                                <AlertDescription>
                                    Your vote of <span className="font-semibold">{selectedProposal.userVote}</span> has been recorded.
                                </AlertDescription>
                            </Alert>
                         )
                    ) : (
                        <Alert variant={selectedProposal.status === 'Failed' ? 'destructive' : 'default'}>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Voting Closed</AlertTitle>
                            <AlertDescription>
                                This proposal has been <span className="font-semibold">{selectedProposal.status.toLowerCase()}</span>.
                            </AlertDescription>
                        </Alert>
                    )}
                </>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
