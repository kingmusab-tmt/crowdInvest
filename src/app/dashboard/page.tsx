
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, DollarSign, Users, TrendingUp, Briefcase } from "lucide-react";
import Link from "next/link";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

import { User, getUsers } from "@/services/userService";
import { Transaction, getTransactions } from "@/services/transactionService";


const chartData = [
  { month: "January", contributions: 1862 },
  { month: "February", contributions: 3051 },
  { month: "March", contributions: 2373 },
  { month: "April", contributions: 734 },
  { month: "May", contributions: 2092 },
  { month: "June", contributions: 2473 },
];

const chartConfig = {
  contributions: {
    label: "Contributions",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfit, setUserProfit] = useState(0);
  const [communityProfit, setCommunityProfit] = useState(0);
  const [activeInvestments, setActiveInvestments] = useState(5); // Mocked for now
  const [recentFundUsage, setRecentFundUsage] = useState<Transaction[]>([]);
  const { toast } = useToast();
  
  // In a real app, you would get the logged-in user's ID from an auth context
  const LOGGED_IN_USER_EMAIL = "olivia.martin@email.com";
  const MEMBER_OF_THE_MONTH_EMAIL = "olivia.martin@email.com";


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, transactions] = await Promise.all([
          getUsers(),
          getTransactions(),
        ]);
        
        // Find the current user and member of the month
        const user = users.find(u => u.email === LOGGED_IN_USER_EMAIL);
        const memberOfTheMonth = users.find(u => u.email === MEMBER_OF_THE_MONTH_EMAIL);

        if (!user || !memberOfTheMonth) {
            throw new Error("Demo user not found.");
        }
        setCurrentUser(user);

        // Calculate profits
        let userProfitTotal = 0;
        let communityProfitTotal = 0;
        transactions.forEach(t => {
            if (t.type === 'Profit Share') {
                communityProfitTotal += t.amount;
                if (t.userEmail === user.email) {
                    userProfitTotal += t.amount;
                }
            }
        });
        setUserProfit(userProfitTotal);
        setCommunityProfit(communityProfitTotal);

        // Filter recent fund usage (investments and assistance)
        const fundUsage = transactions
            .filter(t => (t.type === 'Investment' || t.type === 'Assistance') && t.amount < 0)
            .slice(0, 3);
        setRecentFundUsage(fundUsage);

      } catch (error) {
         console.error("Failed to fetch dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  

  if (loading || !currentUser) {
    return (
       <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader><Skeleton className="h-5 w-2/5" /></CardHeader><CardContent><Skeleton className="h-8 w-3/5" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-5 w-2/5" /></CardHeader><CardContent><Skeleton className="h-8 w-3/5" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-5 w-2/5" /></CardHeader><CardContent><Skeleton className="h-8 w-3/5" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-5 w-2/5" /></CardHeader><CardContent><Skeleton className="h-8 w-3/5" /></CardContent></Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4"><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="h-[300px] w-full" /></CardContent></Card>
            <Card className="lg:col-span-3"><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent className="flex flex-col items-center justify-center text-center gap-4"><Skeleton className="h-24 w-24 rounded-full" /><Skeleton className="h-5 w-1/3" /><Skeleton className="h-10 w-4/5" /></CardContent></Card>
        </div>
        <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Contribution</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentUser.balance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+180.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">+${userProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+19% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Profit</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-emerald-600">+${communityProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeInvestments}</div>
            <p className="text-xs text-muted-foreground">businesses funded</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Contribution Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="contributions" fill="var(--color-contributions)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Member of the Month</CardTitle>
            <CardDescription>
              Celebrating our most engaged community member.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center gap-4">
             <Avatar className="h-24 w-24 border-4 border-primary shadow-lg">
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
                <h3 className="text-xl font-bold">{currentUser.name}</h3>
                <p className="text-muted-foreground">For outstanding contributions and active participation in community events.</p>
            </div>
            <Button asChild>
                <Link href="#">View Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
       <Card>
          <CardHeader className="flex flex-row items-center">
             <div className="grid gap-2">
                <CardTitle>Recent Fund Usage</CardTitle>
                <CardDescription>
                An overview of where the community funds have been allocated.
                </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/investments">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentFundUsage.map((transaction) => (
                    <TableRow key={transaction.id}>
                    <TableCell>
                        <div className="font-medium">{transaction.type} for {transaction.userName}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">{transaction.type}</div>
                    </TableCell>
                    <TableCell className="text-right">${Math.abs(transaction.amount).toFixed(2)}</TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
}
