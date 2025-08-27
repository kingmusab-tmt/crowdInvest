
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, MessageSquare, Star, Globe } from "lucide-react";
import Link from "next/link";
import { getBusinesses, Business } from "@/services/businessService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function BusinessDetailPage({ params: { id } }: { params: { id: string } }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        // Fetch all approved businesses and find the one with the matching id
        const allBusinesses = await getBusinesses();
        const foundBusiness = allBusinesses.find(b => b.id === id);
        setBusiness(foundBusiness || null);
      } catch (error) {
        console.error("Failed to fetch business details:", error);
        toast({
          title: "Error",
          description: "Failed to load business details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
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
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><Skeleton className="h-7 w-1/2"/></CardHeader>
                        <CardContent className="space-y-4"><Skeleton className="h-20 w-full"/></CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Business not found</h1>
        <p className="text-muted-foreground">The business you are looking for does not exist.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/member-businesses">Back to Businesses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
        <div className="mb-6">
            <Button variant="outline" asChild>
                <Link href="/dashboard/member-businesses">
                    <ArrowLeft className="mr-2" />
                    Back to Member Businesses
                </Link>
            </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <CardTitle className="text-3xl mb-2">{business.name}</CardTitle>
                                <CardDescription>Owned by {business.ownerName} &bull; {business.location}</CardDescription>
                             </div>
                             <Badge variant="secondary" className="text-sm">
                                {business.type}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Image
                            src={business.imageUrl}
                            alt={business.name}
                            width={1200}
                            height={800}
                            className="w-full h-auto rounded-lg object-cover"
                            data-ai-hint={business.imageHint}
                        />
                         <p className="mt-6 text-muted-foreground">{business.description}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
                <Card>
                     <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <a href={`mailto:${business.contactEmail}`}><Mail className="mr-2"/>{business.contactEmail}</a>
                        </Button>
                         <Button variant="outline" className="w-full justify-start" asChild>
                            <a href={`tel:${business.contactPhone}`}><Phone className="mr-2"/>{business.contactPhone}</a>
                        </Button>
                        {business.whatsapp && (
                             <Button variant="outline" className="w-full justify-start" asChild>
                                <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`} target="_blank"><MessageSquare className="mr-2"/>WhatsApp</a>
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {business.seekingInvestment && (
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary"><Star/> Seeking Investment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-primary/80 mb-4">This business is looking for funding from the community. A formal investment proposal will be available for voting soon.</p>
                            <Button className="w-full" asChild>
                                <Link href="/dashboard/investments">View Investment Opportunities</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    </div>
  );
}

