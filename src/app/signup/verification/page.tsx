
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mountain } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const communities = ["Northside", "Southside", "West End", "Downtown"];

export default function VerificationPage() {
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="community">Community</Label>
                <Select>
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
                  placeholder="Provide information for your community admin to verify your identity (e.g., your address, family name, or a reference)."
                  required
                />
              </div>
               <Button type="submit" className="w-full">
                Submit for Verification
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
