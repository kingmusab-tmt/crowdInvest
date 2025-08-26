
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const investments = [
  {
    id: "innovate-tech-solutions",
    title: "InnovateTech Solutions",
    description: "A startup developing cutting-edge software for small businesses. Funds are being used for product development and marketing.",
    amount: "15,000",
    goal: "20,000",
    progress: 75,
    status: "Active",
    imageUrl: "https://picsum.photos/600/400",
    imageHint: "tech startup",
  },
  {
    id: "greenleaf-organics-farm",
    title: "GreenLeaf Organics Farm",
    description: "Expanding a local organic farm to supply fresh produce to the community. Investment covers new equipment and land.",
    amount: "25,000",
    goal: "25,000",
    progress: 100,
    status: "Funded",
    imageUrl: "https://picsum.photos/601/400",
    imageHint: "organic farm",
  },
  {
    id: "the-corner-bookstore",
    title: "The Corner Bookstore",
    description: "Renovating a beloved local bookstore to create a modern and inviting space for readers of all ages.",
    amount: "8,500",
    goal: "21,250",
    progress: 40,
    status: "Active",
    imageUrl: "https://picsum.photos/600/401",
    imageHint: "bookstore interior",
  },
  {
    id: "artisan-bakery-co",
    title: "Artisan Bakery Co.",
    description: "Successfully launched a new bakery in the downtown area, now serving fresh bread and pastries daily.",
    amount: "12,000",
    goal: "12,000",
    progress: 100,
    status: "Completed",
    imageUrl: "https://picsum.photos/601/401",
    imageHint: "artisan bread",
  },
];

export default function InvestmentsPage() {
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
               <p className="text-2xl font-bold text-primary">${investment.amount} <span className="text-sm font-normal text-muted-foreground">raised of ${investment.goal}</span></p>
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
