import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

const events = [
  {
    title: "Annual Community Reunion",
    date: "August 15, 2024",
    description: "Join us for our annual get-together. A day of fun, food, and friendship. Funds will be used for catering, venue rental, and entertainment.",
    imageUrl: "https://picsum.photos/600/400",
    imageHint: "community party",
    status: "Upcoming",
  },
  {
    title: "The Smith's Wedding Fund",
    date: "September 5, 2024",
    description: "Let's come together to celebrate the union of two of our beloved members. Contributions will go towards a collective wedding gift.",
    imageUrl: "https://picsum.photos/601/400",
    imageHint: "wedding celebration",
    status: "Upcoming",
  },
  {
    title: "Welcome Baby Doe",
    date: "October 20, 2024",
    description: "A new addition to our community! Funds will be pooled to buy a special gift for the new parents and their baby.",
    imageUrl: "https://picsum.photos/600/401",
    imageHint: "baby gift",
    status: "Planning",
  },
  {
    title: "Community Hall Renovation",
    date: "Completed",
    description: "Thanks to your contributions, we successfully renovated the community hall with new chairs and a sound system.",
    imageUrl: "https://picsum.photos/601/401",
    imageHint: "community hall",
    status: "Completed",
  },
];


export default function EventsPage() {
  return (
    <div>
        <div className="mb-6">
            <h1 className="text-3xl font-bold font-headline">Upcoming Events</h1>
            <p className="text-muted-foreground">See where community funds are making an impact.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event, index) => (
            <Card key={index} className="overflow-hidden flex flex-col">
                <div className="relative">
                    <Image
                        src={event.imageUrl}
                        alt={event.title}
                        width={600}
                        height={400}
                        className="w-full h-48 object-cover"
                        data-ai-hint={event.imageHint}
                    />
                </div>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="mb-2">{event.title}</CardTitle>
                        <Badge variant={event.status === 'Completed' ? 'secondary' : 'default'}>{event.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
                </CardHeader>
                <CardContent className="flex-grow">
                    <CardDescription>{event.description}</CardDescription>
                </CardContent>
            </Card>
        ))}
        </div>
    </div>
  );
}
