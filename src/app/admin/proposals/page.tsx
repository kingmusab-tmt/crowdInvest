
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

export default function CreateProposalPage() {
    const { toast } = useToast();

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const title = formData.get('title');
        
        toast({
            title: "Proposal Created",
            description: `The proposal "${title}" has been created and is now active for voting.`,
        });

        event.currentTarget.reset();
    }

  return (
    <div>
      <div className="mb-6">
          <h1 className="text-3xl font-bold">Create a New Proposal</h1>
          <p className="text-muted-foreground">
            Create a proposal for the community to vote on.
          </p>
      </div>
      <div className="flex justify-center items-start">
        <Card className="w-full max-w-2xl">
            <CardHeader>
            <CardTitle>Proposal Details</CardTitle>
            <CardDescription>
                Fill out the form below to create a new proposal. Once submitted, it will be visible to all community members for voting.
            </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Proposal Title</Label>
                    <Input id="title" name="title" placeholder="e.g., Invest in 'Olivia's Artisan Bakery'?" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="short-description">Short Description</Label>
                    <Textarea
                        id="short-description"
                        name="short-description"
                        placeholder="A brief one-sentence summary of the proposal."
                        required
                        rows={2}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="long-description">Full Description</Label>
                    <Textarea
                        id="long-description"
                        name="long-description"
                        placeholder="Provide a detailed description of the proposal. Include background, justification, costs, and potential benefits."
                        required
                        rows={6}
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" type="submit">
                    <Send className="mr-2 h-4 w-4" />
                    Create and Publish Proposal
                </Button>
            </CardFooter>
            </form>
        </Card>
      </div>
    </div>
  );
}
