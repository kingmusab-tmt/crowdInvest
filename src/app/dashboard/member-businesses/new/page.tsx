
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { createBusiness, Business } from "@/services/businessService";
import { useRouter } from "next/navigation";

// In a real app, this would come from an auth context
const MOCK_USER = {
    name: "Olivia Martin",
    email: "olivia.martin@email.com",
};

export default function NewBusinessPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        
        // In a real app, you would upload the file and get a URL
        const imageUrl = "https://picsum.photos/600/400?random=" + Math.floor(Math.random() * 100);

        const newBusinessData: Omit<Business, 'id'> = {
            name: formData.get('business-name') as string,
            ownerName: MOCK_USER.name,
            ownerEmail: MOCK_USER.email,
            type: formData.get('business-type') as string,
            location: formData.get('business-location') as string,
            description: formData.get('business-nature') as string,
            contactEmail: formData.get('contact-email') as string,
            contactPhone: formData.get('contact-phone') as string,
            whatsapp: formData.get('whatsapp-number') as string || undefined,
            seekingInvestment: formData.get('seeking-investment') === 'on',
            status: 'Pending',
            imageUrl: imageUrl,
            imageHint: 'custom business',
        };

        try {
            await createBusiness(newBusinessData);
            toast({
                title: "Business Submitted",
                description: `Your business "${newBusinessData.name}" has been sent for admin review.`,
            });
            router.push('/dashboard/member-businesses');
        } catch (error) {
            toast({ title: "Submission Failed", description: "Could not submit your business. Please try again.", variant: "destructive" });
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
    <div>
      <div className="mb-4">
          <Button asChild variant="outline">
              <Link href="/dashboard/member-businesses">
                  <ArrowLeft className="mr-2"/>
                  Back to Businesses
              </Link>
          </Button>
      </div>
      <div className="flex justify-center items-start">
        <Card className="w-full max-w-3xl">
            <CardHeader>
            <CardTitle>List Your Business</CardTitle>
            <CardDescription>
                Fill out the form below to add your business to the community directory. It will be reviewed by an admin before being published.
            </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="business-name">Business Name</Label>
                        <Input id="business-name" name="business-name" placeholder="e.g., Olivia's Artisan Bakery" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="business-type">Type of Business</Label>
                        <Select name="business-type" required>
                            <SelectTrigger id="business-type">
                                <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="service">Service-Based</SelectItem>
                                <SelectItem value="product">Product-Based</SelectItem>
                                <SelectItem value="retail">Retail</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="business-location">Business Location</Label>
                    <Input id="business-location" name="business-location" placeholder="e.g., 123 Main St, Northside" required />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="contact-email">Contact Email</Label>
                        <Input id="contact-email" name="contact-email" type="email" placeholder="e.g., contact@bakery.com" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contact-phone">Contact Phone</Label>
                        <Input id="contact-phone" name="contact-phone" type="tel" placeholder="e.g., +1 234 567 890" required />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="whatsapp-number">WhatsApp Number</Label>
                    <Input id="whatsapp-number" name="whatsapp-number" type="tel" placeholder="e.g., +1 234 567 890" />
                    <p className="text-xs text-muted-foreground">Optional: Provide a WhatsApp number for direct messaging.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="business-nature">Nature of Business</Label>
                    <Textarea
                        id="business-nature"
                        name="business-nature"
                        placeholder="Briefly describe your business, its products or services, and your target market."
                        required
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="business-image">Business Image / Logo</Label>
                    <Input id="business-image" name="business-image" type="file" accept="image/*" onChange={handleImageChange} className="text-muted-foreground"/>
                     <p className="text-xs text-muted-foreground">Upload an image that represents your business.</p>
                </div>
                {imagePreview && (
                    <div className="flex justify-center rounded-md border border-dashed p-4">
                        <Image src={imagePreview} alt="Image Preview" width={300} height={200} className="rounded-md object-cover" />
                    </div>
                )}
                <div className="flex items-center space-x-2 pt-4">
                    <Switch id="seeking-investment" name="seeking-investment" />
                    <Label htmlFor="seeking-investment">Are you looking for investment for this business?</Label>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit for Review
                        </>
                    )}
                </Button>
            </CardFooter>
            </form>
        </Card>
      </div>
    </div>
  );
}
