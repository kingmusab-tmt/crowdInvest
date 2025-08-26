
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Check, Info, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ProposalStatus = "Active" | "Passed" | "Failed";
type UserVote = "Accepted" | "Rejected" | null;

type Proposal = {
  id: number;
  title: string;
  description: string;
  longDescription: string;
  status: ProposalStatus;
  acceptedVotes: number;
  rejectedVotes: number;
  totalMembers: number;
  userVote: UserVote;
};

const initialProposals: Proposal[] = [
  {
    id: 1,
    title: "Invest in 'Olivia's Artisan Bakery'?",
    description: "Proposal to invest $5,000 from the community fund to help Olivia expand her bakery business.",
    longDescription: "Olivia Martin is seeking a $5,000 investment to purchase a new industrial oven and expand her product line. This expansion is projected to increase her revenue by 40% within the first year. She has agreed to a 15% return on investment to the community fund over 3 years. This is a great opportunity to support a promising local business.",
    status: "Active",
    acceptedVotes: 68,
    rejectedVotes: 12,
    totalMembers: 152,
    userVote: null,
  },
  {
    id: 2,
    title: "Fund the Annual Summer Festival",
    description: "Allocate $3,000 for the upcoming Annual Summer Festival for logistics, food, and entertainment.",
    longDescription: "The Annual Summer Festival is a cherished tradition. The requested $3,000 will cover venue rental, catering for 200 members, a live band, and activities for children. This event strengthens our community bonds and provides a day of enjoyment for all families.",
    status: "Passed",
    acceptedVotes: 121,
    rejectedVotes: 5,
    totalMembers: 152,
    userVote: "Accepted",
  },
  {
    id: 3,
    title: "Purchase New Chairs for Community Hall?",
    description: "Proposal to spend $1,200 on new, more comfortable seating for the community hall.",
    longDescription: "The current chairs in the community hall are over 10 years old and showing significant wear. This proposal is to purchase 50 new padded, stackable chairs to improve comfort and aesthetics for all community gatherings.",
    status: "Failed",
    acceptedVotes: 45,
    rejectedVotes: 53,
    totalMembers: 152,
    userVote: "Rejected",
  },
];

export default function VotingPage() {
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const handleViewDetails = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsModalOpen(true);
  };

  const handleVote = (vote: 'Accepted' | 'Rejected') => {
    if (!selectedProposal) return;

    const updatedProposals = proposals.map((p) => {
      if (p.id === selectedProposal.id) {
        // Prevent re-voting
        if (p.userVote !== null) return p;

        return {
          ...p,
          userVote: vote,
          acceptedVotes: vote === 'Accepted' ? p.acceptedVotes + 1 : p.acceptedVotes,
          rejectedVotes: vote === 'Rejected' ? p.rejectedVotes + 1 : p.rejectedVotes,
        };
      }
      return p;
    });

    setProposals(updatedProposals);
    setIsModalOpen(false);
    toast({
      title: "Vote Cast!",
      description: `You have successfully voted to ${vote.toLowerCase()} the proposal: "${selectedProposal.title}".`,
    });
  };

  const getStatusBadgeVariant = (status: ProposalStatus) => {
    switch (status) {
      case "Passed": return "secondary";
      case "Failed": return "destructive";
      default: return "default";
    }
  };

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
