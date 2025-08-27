
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Upload } from "lucide-react";
import { createEvent } from "@/services/eventService";
import { useRouter } from "next/navigation";

export default function SubmitEventPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        const title = formData.get('title') as string;

        // In a real app, you would handle file uploads to a storage service.
        // For this demo, we'll use a placeholder image.
        const imageUrl = `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 1000)}`;

        try {
            await createEvent({
                title: title,
                date: formData.get('date') as string,
                description: formData.get('description') as string,
                status: 'Planning', // New events from users default to 'Planning' for admin review
                imageUrl: imageUrl,
                imageHint: 'custom event',
            });
            
            toast({
                title: "Event Submitted",
                description: `Your event "${title}" has been sent for admin review.`,
            });

            router.push('/dashboard/events');
        } catch (error) {
            toast({ title: "Submission Failed", description: "Could not submit your event. Please try again.", variant: "destructive" });
            setIsSubmitting(false);
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImagePreview(null);
        }
    };

  return (
    <div className="flex justify-center items-start pt-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Submit an Event</CardTitle>
          <CardDescription>
            Have an idea for a community event or project? Fill out the form below to submit it for review by an admin.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input id="title" name="title" placeholder="e.g., Summer Community Picnic" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Proposed Date</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Event Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the event, its purpose, and how the funds will be used."
                required
                rows={5}
              />
            </div>
            <div className="space-y-2">
                <Label htmlFor="image">Event Image</Label>
                <Input id="image" name="image" type="file" accept="image/*" onChange={handleImageChange} className="text-muted-foreground"/>
                 <p className="text-xs text-muted-foreground">Upload an image that represents your event.</p>
            </div>
            {imagePreview && (
                <div className="flex justify-center rounded-md border border-dashed p-4">
                    <Image src={imagePreview} alt="Image Preview" width={300} height={200} className="rounded-md object-cover" />
                </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : (
                    <>
                        <Upload className="mr-2 h-4 w-4" />
                        Submit for Review
                    </>
                )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
