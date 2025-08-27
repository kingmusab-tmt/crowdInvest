
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Clock, DollarSign, Target, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { getInvestments, Investment } from "@/services/investmentService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function InvestmentDetailPage({ params }: { params: { id: string } }) {
  const [investment, setInvestment] = useState<Investment | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInvestment = async () => {
      try {
        // In a real app with many investments, you'd fetch a single one by ID.
        // For this demo, we fetch all and find the one we need.
        const investments = await getInvestments();
        const foundInvestment = investments.find(inv => inv.id === params.id);
        if (foundInvestment) {
          setInvestment(foundInvestment);
        }
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

    fetchInvestment();
  }, [params.id, toast]);

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
                        <CardFooter><Skeleton className="h-12 w-full"/></CardFooter>
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

  return (
    <div>
        <div className="mb-6">
            <Button variant="outline" asChild>
                <Link href="/dashboard/investments">
                    <ArrowLeft className="mr-2" />
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

                {investment.timeline && investment.timeline.length > 0 && (
                  <Card>
                      <CardHeader>
                          <CardTitle>Project Timeline</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <ul className="space-y-4">
                              {investment.timeline.map((item, index) => (
                                  <li key={index} className="flex items-start gap-4">
                                      <div>
                                          {item.status === 'Completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
                                      </div>
                                      <div>
                                          <p className="font-medium">{item.description}</p>
                                          <p className="text-sm text-muted-foreground">{item.date}</p>
                                      </div>
                                  </li>
                              ))}
                          </ul>
                      </CardContent>
                  </Card>
                )}

                {investment.gallery && investment.gallery.length > 0 && (
                  <Card>
                      <CardHeader>
                          <CardTitle>Gallery</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {investment.gallery.map((image, index) => (
                               <Image
                                  key={index}
                                  src={image.url}
                                  alt={`Gallery image ${index + 1}`}
                                  width={800}
                                  height={600}
                                  className="w-full h-auto rounded-md object-cover"
                                  data-ai-hint={image.hint}
                              />
                          ))}
                      </CardContent>
                  </Card>
                )}
            </div>

            <div className="lg:col-span-1 space-y-6">
                <Card>
                     <CardHeader>
                        <CardTitle>Funding Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="w-full">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Progress</span>
                                <span>{investment.progress}%</span>
                            </div>
                            <Progress value={investment.progress} />
                        </div>
                         <div className="flex justify-between items-center text-lg">
                            <span className="font-bold text-primary">${investment.amount.toLocaleString()}</span>
                            <span className="text-sm text-muted-foreground">raised of ${investment.goal.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="mr-2 h-4 w-4" />
                            <span>{investment.investors} Community Investors</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button className="w-full" disabled={investment.status !== 'Active'}>
                            <DollarSign className="mr-2" />
                            Invest Now
                        </Button>
                    </CardFooter>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Key Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center"><TrendingUp className="mr-2" /> Projected ROI</span>
                            <span className="font-bold">{investment.projectedROI}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center"><Clock className="mr-2" /> Term</span>
                            <span className="font-bold">{investment.term}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center"><Target className="mr-2" /> Risk Level</span>
                            <Badge variant={investment.risk === 'Low' ? 'secondary' : 'default'}>{investment.risk}</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
