
"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Mail, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

type Notification = {
  id: number
  title: string
  content: string
  timestamp: string
  read: boolean
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: "Welcome to CROWD Invest!",
    content: "We're thrilled to have you join our community. Explore the dashboard to see how you can contribute and benefit.",
    timestamp: "2 days ago",
    read: true,
  },
  {
    id: 2,
    title: "Community Reunion Reminder",
    content: "Don't forget the Annual Community Reunion this Saturday. We look forward to seeing you there!",
    timestamp: "1 day ago",
    read: false,
  },
  {
    id: 3,
    title: "New Investment Opportunity: GreenLeaf Organics",
    content: "A new investment opportunity is now available. Check out the details for GreenLeaf Organics Farm on the Investments page.",
    timestamp: "5 hours ago",
    read: false,
  },
    {
    id: 4,
    title: "Your Deposit Was Successful",
    content: "Your recent deposit of $50.00 has been successfully added to your wallet. Your new balance is $2,350.00.",
    timestamp: "3 days ago",
    read: true,
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications)
  const { toast } = useToast()

  const handleMarkAsRead = (id: number) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }
  
  const handleDelete = (id: number) => {
    const notificationToDelete = notifications.find(n => n.id === id);
    setNotifications(notifications.filter((n) => n.id !== id));
     toast({
      title: "Notification Deleted",
      description: `"${notificationToDelete?.title}" has been deleted.`,
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Your Notifications</h1>
        <p className="text-muted-foreground">
          Stay updated with the latest news and announcements.
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={cn(
                  "flex items-start gap-4 p-4 transition-colors hover:bg-muted/50",
                  !notification.read && "bg-primary/5"
                )}
              >
                <div className="mt-1">
                  <Mail className={cn("h-5 w-5", !notification.read ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {notification.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {notification.timestamp}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                   {!notification.read && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMarkAsRead(notification.id)}>
                        <Check className="h-4 w-4" />
                        <span className="sr-only">Mark as Read</span>
                    </Button>
                   )}
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(notification.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                    </Button>
                </div>
              </li>
            ))}
             {notifications.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    You have no notifications.
                </div>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
