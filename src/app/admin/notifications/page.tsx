
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Send, Trash2, Users, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Notification = {
  id: number;
  subject: string;
  description: string;
  target: string; // e.g., 'All Users', 'Northside'
  sentAt: string;
};

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
];

const availableCommunities = ["Northside", "Southside", "West End", "Downtown"];

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [isNewNotificationDialogOpen, setIsNewNotificationDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSendNotification = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const newNotification: Notification = {
      id: Math.max(0, ...notifications.map(n => n.id)) + 1,
      subject: formData.get("subject") as string,
      description: formData.get("description") as string,
      target: formData.get("target") as string,
      sentAt: new Date().toLocaleString(),
    };
    
    setNotifications([newNotification, ...notifications]);
    setIsNewNotificationDialogOpen(false);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Send and manage notifications for your users.</p>
        </div>
        <Dialog open={isNewNotificationDialogOpen} onOpenChange={setIsNewNotificationDialogOpen}>
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
                   <Select name="target" defaultValue="All Users" required>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select target audience" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All Users">All Users</SelectItem>
                        {availableCommunities.map(community => (
                            <SelectItem key={community} value={community}>{community}</SelectItem>
                        ))}
                    </SelectContent>
                   </Select>
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
                <Button type="submit">
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
                                {notification.target === 'All Users' ? <Users className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
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
