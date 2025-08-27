
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Info, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createAssistanceRequest } from "@/services/assistanceService";
import { getUsers } from "@/services/userService";

// In a real app, you would get the logged-in user's ID/email from an auth context
const LOGGED_IN_USER_EMAIL = "olivia.martin@email.com";

export default function AssistancePage() {
  const { toast } = useToast();
  const [purpose, setPurpose] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const amount = parseFloat(formData.get("amount") as string);

    try {
        // In a real app, user data would come from an auth context
        const users = await getUsers();
        const currentUser = users.find(u => u.email === LOGGED_IN_USER_EMAIL);

        if (!currentUser) {
            throw new Error("Current user not found.");
        }

        await createAssistanceRequest({
            userName: currentUser.name,
            userEmail: currentUser.email,
            community: currentUser.community || "N/A",
            purpose: formData.get("purpose") as string,
            amount: amount,
            returnDate: formData.get("return-date") as string,
            status: "Pending",
        });

        toast({
            title: "Request Submitted",
            description: `Your request for financial assistance of $${amount.toFixed(2)} has been sent for admin review.`,
        });

        (event.currentTarget as HTMLFormElement).reset();
        setPurpose("");
    } catch (error) {
        console.error("Assistance request failed:", error);
        toast({ title: "Request Failed", description: "There was an error submitting your request. Please try again.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="flex justify-center items-start pt-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Financial Assistance Request</CardTitle>
          <CardDescription>
            Submit a request for financial support from the community fund.
            Your request will be reviewed by your community admin.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Finance</Label>
                <Select name="purpose" onValueChange={setPurpose} required>
                  <SelectTrigger id="purpose">
                    <SelectValue placeholder="Select a purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Family Issue">Family Issue</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Health Emergency">Health Emergency</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount Requested (USD)</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    placeholder="1000.00"
                    className="pl-7"
                    required
                    min="1"
                  />
                </div>
              </div>
            </div>
            
            {purpose === "Business" && (
              <div className="space-y-6 p-4 border rounded-md bg-muted/50">
                <div className="space-y-2">
                    <Label htmlFor="business-nature">Nature of Business</Label>
                    <Textarea
                    id="business-nature"
                    name="business-nature"
                    placeholder="Briefly describe your business, its products or services, and your target market."
                    required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="give-back">
                    Community Return Amount (USD)
                    </Label>
                    <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                        $
                    </span>
                    <Input
                        id="give-back"
                        name="give-back"
                        type="number"
                        placeholder="50.00"
                        className="pl-7"
                        required
                        min="0"
                    />
                    </div>
                    <p className="text-xs text-muted-foreground">
                    How much are you willing to give back to the community for assisting you?
                    </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="return-date">Proposed Return Date</Label>
              <Input id="return-date" name="return-date" type="date" required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="details">Additional Details</Label>
                <Textarea
                id="details"
                name="details"
                placeholder="Provide any additional information that can support your request."
                rows={4}
                />
            </div>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Important Note</AlertTitle>
                <AlertDescription>
                 Approval for financial assistance is prioritized for active members of the community. Your contribution history and engagement will be considered during the review process.
                </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Request for Review
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
