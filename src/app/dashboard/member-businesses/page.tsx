
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Star } from "lucide-react";

const businesses = [
  {
    id: "olivia-bakery",
    name: "Olivia's Artisan Bakery",
    owner: "Olivia Martin",
    category: "Food & Beverage",
    description: "Handcrafted bread, pastries, and cakes made with locally-sourced ingredients. A staple in the Northside community.",
    seekingInvestment: true,
    imageUrl: "https://picsum.photos/600/400?random=10",
    imageHint: "artisan bakery",
  },
  {
    id: "lee-web-dev",
    name: "Lee Web Solutions",
    owner: "Jackson Lee",
    category: "Technology",
    description: "Professional web design and development services for small businesses and startups. Helping local businesses grow online.",
    seekingInvestment: false,
    imageUrl: "https://picsum.photos/600/400?random=11",
    imageHint: "web development",
  },
  {
    id: "noah-landscaping",
    name: "Noah's GardenScapes",
    owner: "Noah Williams",
    category: "Home & Garden",
    description: "Complete landscaping and garden maintenance services. From design to regular upkeep, we make your green spaces beautiful.",
    seekingInvestment: true,
    imageUrl: "https://picsum.photos/600/400?random=12",
    imageHint: "landscaping garden",
  },
];

export default function MemberBusinessesPage() {
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
                <CardDescription>By {business.owner}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">{business.description}</p>
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
                <div className="flex justify-between w-full">
                    <Badge variant="secondary">{business.category}</Badge>
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
