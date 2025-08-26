"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function DepositPage() {
    const { toast } = useToast();

    function handleDeposit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const amount = new FormData(event.currentTarget).get('amount');
        toast({
            title: "Deposit Initiated",
            description: `Your deposit of $${amount} is being processed.`,
        });
    }

  return (
    <div className="flex justify-center items-start pt-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Manual Deposit</CardTitle>
          <CardDescription>Enter the amount you wish to deposit. You will be redirected to Monify to complete the transaction.</CardDescription>
        </CardHeader>
        <form onSubmit={handleDeposit}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="amount">Amount (USD)</Label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                    <Input id="amount" name="amount" type="number" placeholder="50.00" className="pl-7" required min="1"/>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit">Deposit with Monify</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
