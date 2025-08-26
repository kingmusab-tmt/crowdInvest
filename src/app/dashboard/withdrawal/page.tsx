
"use client";

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
import { useToast } from "@/hooks/use-toast";
import { Banknote, Repeat, Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TrendingUp } from "lucide-react";

export default function WithdrawalPage() {
  const { toast } = useToast();

  function handleWithdrawalSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const amount = formData.get("amount");

    toast({
      title: "Withdrawal Request Submitted",
      description: `Your request to withdraw $${amount} has been sent for admin review.`,
    });

    event.currentTarget.reset();
  }

  function handleReinvestSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const amount = formData.get("reinvest-amount");

    toast({
      title: "Reinvestment Successful",
      description: `You have successfully reinvested $${amount} from your profits.`,
    });

    event.currentTarget.reset();
  }

  return (
    <div>
       <div className="mb-6">
        <h1 className="text-3xl font-bold">Withdraw & Reinvest</h1>
        <p className="text-muted-foreground">Manage your profits by withdrawing to your bank or reinvesting into the community fund.</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Banknote/> Withdraw Profits</CardTitle>
            <CardDescription>
              Request a withdrawal of your available profits to your local bank account. Requests are processed within 3-5 business days.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleWithdrawalSubmit}>
            <CardContent className="space-y-6">
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>Available for Withdrawal</AlertTitle>
                <AlertDescription className="font-bold text-lg text-emerald-600">
                  $123.45
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount to Withdraw (USD)</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    placeholder="123.45"
                    className="pl-7"
                    required
                    min="1"
                    max="123.45"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank-name">Bank Name</Label>
                <Select name="bank-name" required>
                  <SelectTrigger id="bank-name">
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trust-bank">Community Trust Bank</SelectItem>
                    <SelectItem value="first-national">First National</SelectItem>
                    <SelectItem value="city-union">City Union Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-number">Account Number</Label>
                <Input
                  id="account-number"
                  name="account-number"
                  placeholder="Your 10-digit account number"
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit">
                <Send className="mr-2 h-4 w-4" />
                Submit Withdrawal Request
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Repeat /> Reinvest Profits</CardTitle>
            <CardDescription>
              Grow your contribution by reinvesting your profits back into the community fund.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleReinvestSubmit}>
            <CardContent className="space-y-6">
                 <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertTitle>Available for Reinvestment</AlertTitle>
                    <AlertDescription className="font-bold text-lg text-emerald-600">
                    $123.45
                    </AlertDescription>
                </Alert>

              <div className="space-y-2">
                <Label htmlFor="reinvest-amount">Amount to Reinvest (USD)</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="reinvest-amount"
                    name="reinvest-amount"
                    type="number"
                    placeholder="123.45"
                    className="pl-7"
                    required
                    min="1"
                    max="123.45"
                  />
                </div>
              </div>

               <Alert variant="default" className="bg-primary/5 border-primary/20">
                <Repeat className="h-4 w-4 !text-primary" />
                <AlertTitle className="text-primary">Why Reinvest?</AlertTitle>
                <AlertDescription>
                    Reinvesting your profits helps fund more community projects and businesses, increasing the potential for collective growth and higher future returns for all members.
                </AlertDescription>
            </Alert>

            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit">
                <Repeat className="mr-2 h-4 w-4" />
                Reinvest Now
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
