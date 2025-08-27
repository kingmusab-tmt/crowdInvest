
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Trash2, Sparkles, Vote } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { suggestEventDescription } from "@/ai/flows/suggest-event-flow";
import { getEvents, createEvent, deleteEvent, updateEvent, Event } from "@/services/eventService";

const Countdown = ({ dateString }: { dateString: string }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date(dateString).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [dateString]);

  const isFuture = new Date(dateString).getTime() > new Date().getTime();

  if (!isFuture) {
    return <span className="text-sm text-muted-foreground">Event has passed</span>;
  }

  return (
    <div className="flex space-x-2 text-sm text-muted-foreground">
      <div><span className="font-bold text-foreground">{timeLeft.days}</span>d</div>
      <div><span className="font-bold text-foreground">{timeLeft.hours}</span>h</div>
      <div><span className="font-bold text-foreground">{timeLeft.minutes}</span>m</div>
      <div><span className="font-bold text-foreground">{timeLeft.seconds}</span>s</div>
    </div>
  );
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const fetchedEvents = await getEvents();
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Failed to fetch events:", error);
        toast({
          title: "Error",
          description: "Failed to load event data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [toast]);

  const handleSuggestDescription = async () => {
    if (!eventTitle) {
        toast({ title: "Title is missing", description: "Please enter an event title first.", variant: "destructive" });
        return;
    }
    setIsSuggesting(true);
    try {
        const suggestion = await suggestEventDescription(eventTitle);
        setEventDescription(suggestion);
    } catch (error) {
        console.error("Error suggesting description:", error);
        toast({ title: "Suggestion Failed", description: "Could not generate a description. Please try again.", variant: "destructive" });
    } finally {
        setIsSuggesting(false);
    }
  };

  const handleCreateEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const imageFile = formData.get("image") as File;
    let imageUrl = "https://picsum.photos/600/400"; // default image
    
    // In a real app, you'd upload the file to a storage service (like Firebase Storage)
    // and get a URL. For this example, we'll keep using a placeholder.
    if (imageFile && imageFile.size > 0) {
        // This creates a temporary local URL, it won't persist.
        // For a real implementation, replace this with your file upload logic.
        imageUrl = URL.createObjectURL(imageFile); 
    }
    
    const newEventData: Omit<Event, 'id'> = {
      title: formData.get("title") as string,
      date: formData.get("date") as string,
      description: formData.get("description") as string,
      status: "Planning",
      imageUrl: imageUrl, // Use the placeholder or temp URL
      imageHint: "custom event",
    };

    try {
        const newEvent = await createEvent(newEventData);
        setEvents([newEvent, ...events]);
        setIsNewEventDialogOpen(false);
        setImagePreview(null);
        setEventTitle("");
        setEventDescription("");
        toast({ title: "Event Created", description: `"${newEvent.title}" has been successfully created.` });
    } catch (error) {
        toast({ title: "Error", description: "Failed to create event.", variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const eventToDelete = events.find(e => e.id === eventId);
    if (!eventToDelete) return;
    try {
        await deleteEvent(eventId);
        setEvents(events.filter((event) => event.id !== eventId));
        toast({
          title: "Event Deleted",
          description: `"${eventToDelete?.title}" has been deleted.`,
          variant: "destructive",
        });
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete event.", variant: "destructive" });
    }
  };

  const handleMarkAsCompleted = async (eventId: string) => {
    const eventToUpdate = events.find(e => e.id === eventId);
    if (!eventToUpdate) return;
    try {
        await updateEvent(eventId, { status: "Completed" });
        setEvents(
          events.map((event) =>
            event.id === eventId ? { ...event, status: "Completed" } : event
          )
        );
        toast({
          title: "Event Completed",
          description: `"${eventToUpdate?.title}" has been marked as completed.`,
        });
    } catch (error) {
        toast({ title: "Error", description: "Failed to update event status.", variant: "destructive" });
    }
  };

  const handlePushToVoting = (event: Event) => {
    toast({
      title: "Pushed to Voting",
      description: `A proposal for the event "${event.title}" has been created.`,
    });
  };

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Event Management</h1>
          <p className="text-muted-foreground">Create, monitor, and manage community events.</p>
        </div>
        <Dialog open={isNewEventDialogOpen} onOpenChange={(isOpen) => {
            setIsNewEventDialogOpen(isOpen);
            if (!isOpen) {
              setImagePreview(null);
              setEventTitle("");
              setEventDescription("");
            }
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>Fill in the details for the new event.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEvent}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Title</Label>
                  <Input id="title" name="title" className="col-span-3" required value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Date</Label>
                  <Input id="date" name="date" type="date" className="col-span-3" required />
                </div>
                <div className="relative grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">Description</Label>
                  <div className="col-span-3">
                    <Textarea id="description" name="description" className="pr-10" required value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} />
                     <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1 h-8 w-8" onClick={handleSuggestDescription} disabled={isSuggesting}>
                        <Sparkles className={`h-4 w-4 ${isSuggesting ? 'animate-spin' : ''}`} />
                        <span className="sr-only">Suggest Description</span>
                    </Button>
                  </div>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="image" className="text-right">Image</Label>
                  <Input id="image" name="image" type="file" className="col-span-3" accept="image/*" onChange={handleImageChange}/>
                </div>
                {imagePreview && (
                  <div className="col-span-4 flex justify-center">
                    <Image src={imagePreview} alt="Image Preview" width={200} height={200} className="rounded-md object-cover" />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit">Create Event</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
            <p>Loading events...</p>
        ) : events.map((event) => (
          <Card key={event.id} className="flex flex-col overflow-hidden">
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
                <CardTitle className="mb-1">{event.title}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    {event.status !== 'Completed' && (
                        <DropdownMenuItem onClick={() => handlePushToVoting(event)}>
                            <Vote className="mr-2 h-4 w-4" />
                            Push for Voting
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleMarkAsCompleted(event.id)} disabled={event.status === 'Completed'}>
                      Mark as Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteEvent(event.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <Badge variant={event.status === 'Completed' ? 'secondary' : 'default'}>{event.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{event.description}</CardDescription>
            </CardContent>
            <CardFooter>
              {event.status !== 'Completed' ? (
                <Countdown dateString={event.date} />
              ) : (
                 <span className="text-sm text-muted-foreground">Event completed</span>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
