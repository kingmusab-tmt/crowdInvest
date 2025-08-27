
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getInvestments, Investment } from "@/services/investmentService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const fetchedInvestments = await getInvestments();
        setInvestments(fetchedInvestments);
      } catch (error) {
        console.error("Failed to fetch investments:", error);
        toast({
          title: "Error",
          description: "Failed to load investment data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, [toast]);

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <Skeleton className="h-9 w-1/3" />
          <Skeleton className="h-5 w-2/3 mt-2" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-8 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Community Investments</h1>
        <p className="text-muted-foreground">
          See how our collective funds are empowering local businesses and projects.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {investments.map((investment) => (
          <Card key={investment.id} className="overflow-hidden flex flex-col">
            <div className="relative">
              <Image
                src={investment.imageUrl}
                alt={investment.title}
                width={600}
                height={400}
                className="w-full h-48 object-cover"
                data-ai-hint={investment.imageHint}
              />
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="mb-2">{investment.title}</CardTitle>
                <Badge variant={investment.status === 'Completed' || investment.status === 'Funded' ? 'secondary' : 'default'}>
                  {investment.status}
                </Badge>
              </div>
               <p className="text-2xl font-bold text-primary">${investment.amount.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">raised of ${investment.goal.toLocaleString()}</span></p>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{investment.description}</CardDescription>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2">
                <div className="w-full">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Funding Progress</span>
                        <span>{investment.progress}%</span>
                    </div>
                    <Progress value={investment.progress} />
                </div>
                <Button variant="outline" className="w-full mt-2" asChild>
                  <Link href={`/dashboard/investments/${investment.id}`}>View Details</Link>
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
