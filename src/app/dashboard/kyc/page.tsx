
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createKycRequest } from "@/services/kycService";
import { getUsers } from "@/services/userService";

// In a real app, you would get the logged-in user's ID/email from an auth context
const LOGGED_IN_USER_EMAIL = "olivia.martin@email.com";

export default function KycPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleKycSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        
        try {
            // In a real app, user data would come from an auth context
            const users = await getUsers();
            const currentUser = users.find(u => u.email === LOGGED_IN_USER_EMAIL);

            if (!currentUser) {
                throw new Error("Current user not found.");
            }

            await createKycRequest({
                userId: currentUser.id,
                userName: currentUser.name,
                bvn: formData.get('bvn') as string,
                nin: formData.get('nin') as string,
                status: 'Pending',
                submittedAt: new Date().toISOString(),
            });

            toast({
                title: "Verification Submitted",
                description: "Your KYC information has been submitted and is pending review.",
            });
            
            router.push('/dashboard');

        } catch (error) {
            console.error("KYC submission failed:", error);
            toast({ title: "Submission Failed", description: "There was an error submitting your information. Please try again.", variant: "destructive" });
            setIsSubmitting(false);
        }
    }

  return (
    <div className="flex justify-center items-start pt-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <ShieldCheck className="h-8 w-8 text-primary"/>
            <div>
                <CardTitle>Complete Your Profile (KYC)</CardTitle>
                <CardDescription>
                    To comply with regulations and ensure a secure platform, please provide your verification numbers.
                </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleKycSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="bvn">Bank Verification Number (BVN)</Label>
                <Input id="bvn" name="bvn" type="text" placeholder="Enter your 11-digit BVN" required pattern="\d{11}" title="BVN must be 11 digits." />
                <p className="text-xs text-muted-foreground">Your BVN is used to verify your identity. <Link href="#" className="underline">Learn more</Link>.</p>
            </div>
             <div className="space-y-2">
                <Label htmlFor="nin">National Identification Number (NIN)</Label>
                <Input id="nin" name="nin" type="text" placeholder="Enter your 11-digit NIN" required pattern="\d{11}" title="NIN must be 11 digits." />
                 <p className="text-xs text-muted-foreground">Your NIN is required for identity verification.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Submitting..." : "Submit for Verification"}
            </Button>
            <p className="text-xs text-center text-muted-foreground w-full">
                By submitting, you agree to our <Link href="#" className="underline">Terms of Service</Link> and <Link href="#" className="underline">Privacy Policy</Link>. Your data is encrypted and stored securely.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
