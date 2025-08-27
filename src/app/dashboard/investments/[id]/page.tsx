
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, DollarSign, Target, TrendingUp, Users, PieChart } from "lucide-react";
import Link from "next/link";
import { getInvestments, Investment } from "@/services/investmentService";
import { getUsers } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function InvestmentDetailPage({ params: { id } }: { params: { id: string } }) {
  const [investment, setInvestment] = useState<Investment | null>(null);
  const [totalFunds, setTotalFunds] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [investments, users] = await Promise.all([
            getInvestments(),
            getUsers()
        ]);
        
        const foundInvestment = investments.find(inv => inv.id === id);
        if (foundInvestment) {
          setInvestment(foundInvestment);
        }

        const totalCommunityFunds = users.reduce((sum, user) => sum + user.balance, 0);
        setTotalFunds(totalCommunityFunds);

      } catch (error) {
        console.error("Failed to fetch investment details:", error);
        toast({
          title: "Error",
          description: "Failed to load investment details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, toast]);

  if (loading) {
    return (
        <div>
            <Skeleton className="h-10 w-48 mb-6" />
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader><Skeleton className="h-8 w-3/4 mb-2"/><Skeleton className="h-5 w-full"/></CardHeader>
                        <CardContent><Skeleton className="w-full h-96 rounded-lg"/></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><Skeleton className="h-7 w-1/3"/></CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><Skeleton className="h-7 w-1/2"/></CardHeader>
                        <CardContent className="space-y-4"><Skeleton className="h-20 w-full"/></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><Skeleton className="h-7 w-1/2"/></CardHeader>
                        <CardContent className="space-y-3"><Skeleton className="h-16 w-full"/></CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
  }

  if (!investment) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Investment not found</h1>
        <p className="text-muted-foreground">The investment you are looking for does not exist.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/investments">Back to Investments</Link>
        </Button>
      </div>
    );
  }

  const investmentPercentageOfTotal = totalFunds > 0 ? (investment.amount / totalFunds) * 100 : 0;

  return (
    <div>
        <div className="mb-6">
            <Button variant="outline" asChild>
                <Link href="/dashboard/investments">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Investments
                </Link>
            </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <CardTitle className="text-3xl mb-2">{investment.title}</CardTitle>
                                <CardDescription>{investment.description}</CardDescription>
                             </div>
                             <Badge variant={investment.status === 'Completed' || investment.status === 'Funded' ? 'secondary' : 'default'} className="text-sm">
                                {investment.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Image
                            src={investment.imageUrl}
                            alt={investment.title}
                            width={1200}
                            height={800}
                            className="w-full h-auto rounded-lg object-cover"
                            data-ai-hint={investment.imageHint}
                        />
                         <p className="mt-6 text-muted-foreground">{investment.longDescription}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Investment Timeline</CardTitle>
                        <CardDescription>A summary of your financial involvement with this investment.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Activity</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>2024-07-15</TableCell>
                                    <TableCell>Initial Investment</TableCell>
                                    <TableCell className="text-right text-red-600">-$50.00</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>2024-08-01</TableCell>
                                    <TableCell>Profit Share Payout</TableCell>
                                    <TableCell className="text-right text-green-600">+$5.75</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>2024-09-01</TableCell>
                                    <TableCell>Profit Share Payout</TableCell>
                                    <TableCell className="text-right text-green-600">+$6.10</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
                <Card>
                     <CardHeader>
                        <CardTitle>Funding Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex justify-between items-center text-lg">
                            <span className="font-bold text-primary">${investment.amount.toLocaleString()}</span>
                            <span className="text-sm text-muted-foreground">Total Amount Invested</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="mr-2 h-4 w-4" />
                            <span>{investment.investors} Community Investors</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <PieChart className="mr-2 h-4 w-4" />
                            <span>{investmentPercentageOfTotal.toFixed(2)}% of total community funds</span>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Key Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center"><TrendingUp className="mr-2 h-4 w-4" /> Projected ROI</span>
                            <span className="font-bold">{investment.projectedROI}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center"><Clock className="mr-2 h-4 w-4" /> Term</span>
                            <span className="font-bold">{investment.term}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center"><Target className="mr-2 h-4 w-4" /> Risk Level</span>
                            <Badge variant={investment.risk === 'Low' ? 'secondary' : 'default'}>{investment.risk}</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
