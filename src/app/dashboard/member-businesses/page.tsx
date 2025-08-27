
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Star } from "lucide-react";
import { getBusinesses, Business } from "@/services/businessService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function MemberBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const fetchedBusinesses = await getBusinesses("Approved");
        setBusinesses(fetchedBusinesses);
      } catch (error) {
        console.error("Failed to fetch businesses:", error);
        toast({
          title: "Error",
          description: "Failed to load business data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [toast]);

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-9 w-1/3" />
            <Skeleton className="h-5 w-2/3 mt-2" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-5 w-1/2 mt-2" />
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
      <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-3xl font-bold">Member Businesses</h1>
            <p className="text-muted-foreground">
            Support and connect with businesses from our own community.
            </p>
        </div>
        <Button asChild>
            <Link href="/dashboard/member-businesses/new">
                <PlusCircle className="mr-2" />
                Add Your Business
            </Link>
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {businesses.map((business) => (
          <Card key={business.id} className="overflow-hidden flex flex-col">
            <div className="relative">
              <Image
                src={business.imageUrl}
                alt={business.name}
                width={600}
                height={400}
                className="w-full h-48 object-cover"
                data-ai-hint={business.imageHint}
              />
            </div>
            <CardHeader>
                <CardTitle className="mb-1">{business.name}</CardTitle>
                <CardDescription>By {business.ownerName}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">{business.description}</p>
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
                <div className="flex justify-between w-full">
                    <Badge variant="secondary">{business.type}</Badge>
                    {business.seekingInvestment && (
                        <Badge variant="default" className="gap-1">
                            <Star className="h-3 w-3" />
                            Seeking Investment
                        </Badge>
                    )}
                </div>
                <Button variant="outline" className="w-full mt-2" asChild>
                  <Link href={`#`}>View Details</Link>
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
