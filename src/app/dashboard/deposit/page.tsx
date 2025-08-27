
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banknote, Copy, CreditCard, Repeat, Calendar as CalendarIcon, DollarSign as DollarSignIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { createTransaction } from "@/services/transactionService";
import { updateUser, getUsers } from "@/services/userService";

// In a real app, you would get the logged-in user's ID/email from an auth context
const LOGGED_IN_USER_EMAIL = "olivia.martin@email.com";

export default function DepositPage() {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [frequency, setFrequency] = useState("");
    const [day, setDay] = useState("");
    const [amount, setAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleCardDeposit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        const depositAmount = parseFloat(formData.get('amount') as string);

        if (isNaN(depositAmount) || depositAmount <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a valid deposit amount.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }

        try {
            // In a real app, user data would come from an auth context
            const users = await getUsers();
            const currentUser = users.find(u => u.email === LOGGED_IN_USER_EMAIL);

            if (!currentUser) {
                throw new Error("Current user not found.");
            }

            // 1. Create a new transaction record
            await createTransaction({
                userName: currentUser.name,
                userEmail: currentUser.email,
                type: "Deposit",
                status: "Completed",
                amount: depositAmount,
                date: new Date().toISOString(),
            });

            // 2. Update the user's balance
            const newBalance = currentUser.balance + depositAmount;
            await updateUser(currentUser.id, { balance: newBalance });
            
            toast({
                title: "Deposit Successful",
                description: `Your deposit of $${depositAmount.toFixed(2)} has been processed.`,
            });
            (event.target as HTMLFormElement).reset();
        } catch (error) {
            console.error("Deposit failed:", error);
            toast({ title: "Deposit Failed", description: "There was an error processing your deposit. Please try again.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied to Clipboard",
            description: "Account number has been copied.",
        });
    };

    const handleAutomatedSetup = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        toast({
            title: "Automated Deposit Setup",
            description: `Setup for a ${frequency} deposit of $${amount} is being initiated via Monify.`,
        });
        // Reset state
        setStep(1);
        setFrequency("");
        setDay("");
        setAmount("");
    }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
        {/* Manual Deposit Section */}
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Manual Deposit</CardTitle>
                <CardDescription>Choose your preferred method to add funds to your wallet instantly.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="bank-transfer">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="bank-transfer"><Banknote className="mr-2"/> Bank Transfer</TabsTrigger>
                        <TabsTrigger value="card"><CreditCard className="mr-2"/> Card Payment</TabsTrigger>
                    </TabsList>
                    <TabsContent value="bank-transfer" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Bank Account Details</CardTitle>
                                <CardDescription>Transfer funds to the account below. Your wallet will be credited automatically upon confirmation.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Account Number:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-semibold">0123456789</span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard('0123456789')}>
                                            <Copy className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Bank Name:</span>
                                    <span className="font-semibold">Community Trust Bank</span>
                                </div>
                                 <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Account Name:</span>
                                    <span className="font-semibold">CROWD Invest User Wallet</span>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="card" className="mt-6">
                         <form onSubmit={handleCardDeposit}>
                            <CardContent className="p-0">
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
                            <CardFooter className="px-0 pt-6">
                                <Button className="w-full" type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Processing...' : 'Deposit with Monify'}
                                </Button>
                            </CardFooter>
                        </form>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

        {/* Automated Deposit Section */}
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Automated Deposit Setup</CardTitle>
                <CardDescription>Set up recurring deposits to your wallet automatically.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAutomatedSetup} className="space-y-6">
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in-50">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="frequency"><Repeat className="inline mr-2" /> Frequency</Label>
                                <Select required onValueChange={(value) => setFrequency(value)}>
                                    <SelectTrigger id="frequency">
                                        <SelectValue placeholder="How often?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full" onClick={() => setStep(2)} disabled={!frequency}>Next</Button>
                        </div>
                    )}

                    {step === 2 && (
                         <div className="space-y-4 animate-in fade-in-50">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="day"><CalendarIcon className="inline mr-2" /> Day of Deposit</Label>
                                <Select required onValueChange={(value) => setDay(value)}>
                                    <SelectTrigger id="day">
                                        <SelectValue placeholder="On which day?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {frequency === 'weekly' && ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                        {frequency === 'monthly' && Array.from({ length: 28 }, (_, i) => i + 1).map(d => <SelectItem key={d} value={d.toString()}>{`Day ${d}`}</SelectItem>)}
                                        {frequency === 'yearly' && ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="w-full" onClick={() => setStep(1)}>Back</Button>
                                <Button className="w-full" onClick={() => setStep(3)} disabled={!day}>Next</Button>
                            </div>
                        </div>
                    )}
                    
                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in-50">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="auto-amount"><DollarSignIcon className="inline mr-2" /> Amount (USD)</Label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                                    <Input id="auto-amount" name="auto-amount" type="number" placeholder="50.00" className="pl-7" required min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
                                </div>
                            </div>
                             <div className="flex gap-2">
                                <Button variant="outline" className="w-full" onClick={() => setStep(2)}>Back</Button>
                                <Button className="w-full" type="submit" disabled={!amount}>Setup with Monify</Button>
                            </div>
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    </div>
  );
}

    