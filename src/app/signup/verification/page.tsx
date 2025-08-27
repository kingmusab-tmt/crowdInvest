
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mountain } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseAuthUser } from "firebase/auth";
import { updateUserCommunity } from "@/services/userService";
import { Skeleton } from "@/components/ui/skeleton";

const communities = ["Northside", "Southside", "West End", "Downtown"];

export default function VerificationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<FirebaseAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        // If no user is logged in, they shouldn't be here
        router.push('/signup');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  async function handleVerificationSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser) {
        toast({ title: "Error", description: "No logged in user found.", variant: "destructive" });
        return;
    }
    
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const community = formData.get('community') as string;
    const verificationInfo = formData.get('verification') as string;

    if (!community || !verificationInfo) {
        toast({ title: "Missing Information", description: "Please fill out all fields.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    try {
        await updateUserCommunity(currentUser.email!, community, verificationInfo);
        toast({
            title: "Information Submitted",
            description: "Your community details have been saved. One final step!",
        });
        router.push('/dashboard/kyc');
    } catch (error) {
        console.error("Verification submission failed:", error);
        toast({ title: "Submission Failed", description: "Could not save your information. Please try again.", variant: "destructive" });
        setIsSubmitting(false);
    }
  }

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-screen">
              <Skeleton className="h-[450px] w-full max-w-md" />
          </div>
      )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl">
                <Mountain className="h-8 w-8 text-primary" />
                <span>CROWD Invest</span>
            </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Complete Your Registration</CardTitle>
            <CardDescription>Just one more step. Please provide your community details for verification.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="community">Community</Label>
                <Select name="community" required>
                  <SelectTrigger id="community">
                    <SelectValue placeholder="Select your community" />
                  </SelectTrigger>
                  <SelectContent>
                    {communities.map((community) => (
                      <SelectItem key={community} value={community}>
                        {community}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="verification">Verification Information</Label>
                <Textarea
                  id="verification"
                  name="verification"
                  placeholder="Provide information for your community admin to verify your identity (e.g., your address, family name, or a reference)."
                  required
                />
              </div>
               <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit for Verification"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
