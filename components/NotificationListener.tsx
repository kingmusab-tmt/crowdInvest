"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  useNotificationPermission,
  sendNativeNotification,
} from "@/hooks/use-notification-permission";

interface NotificationActionType {
  action: string;
  title: string;
}

export default function NotificationListener() {
  const { data: session, status } = useSession();
  const notificationTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  useNotificationPermission();

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const checkForNewNotifications = async () => {
      try {
        const res = await fetch("/api/users/notifications?countOnly=true");
        if (res.ok) {
          const data = await res.json();
          const previousCount = sessionStorage.getItem("notificationCount");
          const currentCount = data.count;

          if (
            previousCount &&
            parseInt(currentCount) > parseInt(previousCount)
          ) {
            // New notifications arrived - fetch them and show native notification
            const pushEnabled =
              session?.user?.settings?.notifications?.push !== false;

            const notificationsRes = pushEnabled
              ? await fetch("/api/users/notifications")
              : null;
            if (notificationsRes?.ok) {
              const notifications = await notificationsRes.json();
              const latestNotification = notifications[0];

              // Show native PWA notification
              sendNativeNotification(
                latestNotification.title || "New Notification",
                {
                  body:
                    latestNotification.message || "You have a new notification",
                  tag: "crowdinvest-notification",
                  requireInteraction: true,
                  vibrate: [200, 100, 200],
                  actions: [
                    {
                      action: "open",
                      title: "Open",
                    },
                    {
                      action: "close",
                      title: "Close",
                    },
                  ] as NotificationActionType[],
                } as NotificationOptions & {
                  actions?: NotificationActionType[];
                }
              );
            }
          }

          sessionStorage.setItem("notificationCount", String(currentCount));
        }
      } catch (error) {
        console.error("Failed to check notifications:", error);
      }
    };

    // Check for new notifications every 10 seconds
    notificationTimerRef.current = setInterval(checkForNewNotifications, 10000);

    // Check immediately on mount
    checkForNewNotifications();

    return () => {
      if (notificationTimerRef.current) {
        clearInterval(notificationTimerRef.current);
      }
    };
  }, [status, session?.user?.settings?.notifications?.push]);

  return null;
}
