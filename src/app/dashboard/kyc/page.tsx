
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function KycPage() {
    const { toast } = useToast();

    function handleKycSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const nin = formData.get('nin');
        const bvn = formData.get('bvn');
        
        console.log({ nin, bvn });

        toast({
            title: "Verification Submitted",
            description: "Your KYC information has been submitted for verification.",
        });
        
        // In a real application, you would redirect the user after successful submission
        // For now, we'll just show the toast.
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
            <Button className="w-full" type="submit">Submit for Verification</Button>
            <p className="text-xs text-center text-muted-foreground w-full">
                By submitting, you agree to our <Link href="#" className="underline">Terms of Service</Link> and <Link href="#" className="underline">Privacy Policy</Link>. Your data is encrypted and stored securely.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
