
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

export default function SubmitEventPage() {
    const { toast } = useToast();
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const title = formData.get('title');
        
        toast({
            title: "Event Submitted",
            description: `Your event "${title}" has been sent for admin review.`,
        });

        // Reset form
        event.currentTarget.reset();
        setImagePreview(null);
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
            <Button className="w-full" type="submit">
                <Upload className="mr-2 h-4 w-4" />
                Submit for Review
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
