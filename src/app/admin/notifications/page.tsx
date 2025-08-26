
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Send, Trash2, Users, Building2, Check, ChevronsUpDown, User } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Notification = {
  id: number;
  subject: string;
  description: string;
  target: string; // e.g., 'All Users', 'Northside', 'olivia.martin@email.com'
  sentAt: string;
};

// Mock data, in a real app this would come from a database
const initialUsers = [
  { id: 'usr_1', name: 'Olivia Martin', email: 'olivia.martin@email.com' },
  { id: 'usr_2', name: 'Jackson Lee', email: 'jackson.lee@email.com' },
  { id: 'usr_3', name: 'Liam Johnson', email: 'liam@example.com' },
  { id: 'usr_4', name: 'Noah Williams', email: 'noah@example.com' },
  { id: 'usr_5', name: 'Admin User', email: 'admin@example.com' },
  { id: 'usr_6', name: 'Ethan Jones', email: 'ethan.jones@email.com' },
];

const initialNotifications: Notification[] = [
  {
    id: 1,
    subject: "Community Reunion Reminder",
    description: "Just a friendly reminder that the Annual Community Reunion is next week! We can't wait to see you all there.",
    target: "All Users",
    sentAt: "2024-08-08 10:00 AM",
  },
  {
    id: 2,
    subject: "Southside Festival Volunteers Needed",
    description: "We are looking for volunteers to help with the upcoming Southside Annual Festival. Please sign up if you're available.",
    target: "Southside",
    sentAt: "2024-08-05 02:30 PM",
  },
  {
    id: 3,
    subject: "Welcome Gift Ready",
    description: "Hi Olivia, your welcome gift is ready for pickup at the community center. Congratulations on joining!",
    target: "Olivia Martin",
    sentAt: "2024-08-10 09:00 AM",
  },
];

const availableCommunities = ["Northside", "Southside", "West End", "Downtown"];

const targetOptions = [
    { value: "All Users", label: "All Users" },
    ...availableCommunities.map(c => ({ value: c, label: c })),
    ...initialUsers.map(u => ({ value: u.name, label: `${u.name} (${u.email})`, type: 'user' }))
];


export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [isNewNotificationDialogOpen, setIsNewNotificationDialogOpen] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState("");
  const { toast } = useToast();

  const handleSendNotification = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const newNotification: Notification = {
      id: Math.max(0, ...notifications.map(n => n.id)) + 1,
      subject: formData.get("subject") as string,
      description: formData.get("description") as string,
      target: selectedTarget,
      sentAt: new Date().toLocaleString(),
    };
    
    setNotifications([newNotification, ...notifications]);
    setIsNewNotificationDialogOpen(false);
    setSelectedTarget("");
    toast({ title: "Notification Sent", description: `Your notification "${newNotification.subject}" has been sent.` });
  };

  const handleDeleteNotification = (notificationId: number) => {
    const notificationToDelete = notifications.find(n => n.id === notificationId);
    setNotifications(notifications.filter((notification) => notification.id !== notificationId));
    toast({
      title: "Notification Deleted",
      description: `The notification "${notificationToDelete?.subject}" has been deleted.`,
      variant: "destructive",
    });
  };

  const getTargetIcon = (target: string) => {
      if (target === 'All Users') return <Users className="h-3 w-3" />;
      if (availableCommunities.includes(target)) return <Building2 className="h-3 w-3" />;
      return <User className="h-3 w-3" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Send and manage notifications for your users.</p>
        </div>
        <Dialog open={isNewNotificationDialogOpen} onOpenChange={(isOpen) => {
            setIsNewNotificationDialogOpen(isOpen);
            if (!isOpen) {
                setSelectedTarget("");
            }
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Send Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Compose Notification</DialogTitle>
              <DialogDescription>Fill in the details to send a new notification to users.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendNotification}>
              <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="target" className="text-right">To</Label>
                   <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={comboboxOpen}
                          className="col-span-3 justify-between"
                        >
                          {selectedTarget
                            ? targetOptions.find((opt) => opt.value === selectedTarget)?.label
                            : "Select target..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Search target..." />
                          <CommandList>
                            <CommandEmpty>No target found.</CommandEmpty>
                            <CommandGroup heading="General">
                                <CommandItem
                                onSelect={() => {
                                    setSelectedTarget("All Users");
                                    setComboboxOpen(false);
                                }}
                                >
                                <Check className={cn("mr-2 h-4 w-4", selectedTarget === "All Users" ? "opacity-100" : "opacity-0")}/>
                                All Users
                                </CommandItem>
                            </CommandGroup>
                            <CommandGroup heading="Communities">
                                {availableCommunities.map((community) => (
                                    <CommandItem
                                    key={community}
                                    onSelect={() => {
                                        setSelectedTarget(community);
                                        setComboboxOpen(false);
                                    }}
                                    >
                                    <Check className={cn("mr-2 h-4 w-4", selectedTarget === community ? "opacity-100" : "opacity-0")}/>
                                    {community}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            <CommandGroup heading="Users">
                                {initialUsers.map((user) => (
                                     <CommandItem
                                    key={user.id}
                                    onSelect={() => {
                                        setSelectedTarget(user.name);
                                        setComboboxOpen(false);
                                    }}
                                    >
                                    <Check className={cn("mr-2 h-4 w-4", selectedTarget === user.name ? "opacity-100" : "opacity-0")}/>
                                    {user.name}
                                    <span className="ml-2 text-xs text-muted-foreground">{user.email}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="subject" className="text-right">Subject</Label>
                  <Input id="subject" name="subject" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">Description</Label>
                  <Textarea id="description" name="description" className="col-span-3" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!selectedTarget}>
                    <Send className="mr-2 h-4 w-4" />
                    Send Now
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Sent Notifications</CardTitle>
            <CardDescription>A history of all notifications that have been sent.</CardDescription>
        </CardHeader>
        <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {notifications.map((notification) => (
                    <TableRow key={notification.id}>
                        <TableCell className="font-medium">{notification.subject}</TableCell>
                        <TableCell>
                           <Badge variant={notification.target === 'All Users' ? 'default' : 'secondary'} className="gap-1">
                                {getTargetIcon(notification.target)}
                                {notification.target}
                           </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{notification.sentAt}</TableCell>
                        <TableCell className="text-center">
                            <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDeleteNotification(notification.id)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    