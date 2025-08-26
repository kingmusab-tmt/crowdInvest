
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Clock, DollarSign, Target, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

// Mock data - in a real app, this would be fetched based on the `params.id`
const investments = [
  {
    id: "innovate-tech-solutions",
    title: "InnovateTech Solutions",
    description: "A startup developing cutting-edge software for small businesses. Funds are being used for product development and marketing.",
    longDescription: "InnovateTech Solutions is poised to revolutionize the small business sector with its intuitive and affordable software suite. Our platform integrates inventory management, customer relations, and sales analytics into one seamless experience. The funds raised will be allocated to hiring two additional developers to accelerate our product roadmap and launching a comprehensive digital marketing campaign to reach our target audience across North America.",
    amount: "15,000",
    goal: "20,000",
    progress: 75,
    investors: 42,
    status: "Active",
    imageUrl: "https://picsum.photos/1200/800",
    imageHint: "tech startup office",
    projectedROI: "18%",
    term: "3 Years",
    risk: "Medium",
    gallery: [
      { url: "https://picsum.photos/800/600?random=1", hint: "team meeting" },
      { url: "https://picsum.photos/800/600?random=2", hint: "software dashboard" },
      { url: "https://picsum.photos/800/600?random=3", hint: "office space" },
    ],
    timeline: [
        { status: "Completed", date: "2024-05-10", description: "Funding campaign launched." },
        { status: "Completed", date: "2024-06-01", description: "Reached 50% funding goal." },
        { status: "InProgress", date: "2024-08-01", description: "Hiring of new developers." },
        { status: "Upcoming", date: "2024-09-15", description: "Alpha version release." },
    ]
  },
  // Add other investment details here...
  {
    id: "greenleaf-organics-farm",
    title: "GreenLeaf Organics Farm",
    description: "Expanding a local organic farm to supply fresh produce to the community.",
    longDescription: "GreenLeaf has been a staple of our community for years. This expansion will allow us to double our crop yield, introduce a new range of seasonal vegetables, and establish a direct-to-consumer subscription box service. The investment covers the purchase of an adjacent 5-acre plot and state-of-the-art irrigation equipment.",
    amount: "25,000",
    goal: "25,000",
    progress: 100,
    investors: 89,
    status: "Funded",
    imageUrl: "https://picsum.photos/1201/800",
    imageHint: "organic farm field",
    projectedROI: "12%",
    term: "5 Years",
    risk: "Low",
    gallery: [
         { url: "https://picsum.photos/800/600?random=4", hint: "fresh vegetables" },
         { url: "https://picsum.photos/800/600?random=5", hint: "farm tractor" },
         { url: "https://picsum.photos/800/600?random=6", hint: "community market stall" },
    ],
    timeline: [
        { status: "Completed", date: "2024-04-01", description: "Funding campaign launched." },
        { status: "Completed", date: "2024-05-20", description: "Funding goal achieved!" },
        { status: "Completed", date: "2024-07-01", description: "Acquired new land plot." },
        { status: "InProgress", date: "2024-08-15", description: "Installation of irrigation system." },
    ]
  },
];


export default function InvestmentDetailPage({ params }: { params: { id: string } }) {
  const investment = investments.find(inv => inv.id === params.id);

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
                            <span className="font-bold text-primary">${investment.amount}</span>
                            <span className="text-sm text-muted-foreground">raised of ${investment.goal}</span>
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
