"use client";

import { useEffect } from "react";

export function useNotificationPermission() {
  useEffect(() => {
    // Request notification permission on first load
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);
}

export function sendNativeNotification(
  title: string,
  options?: NotificationOptions
) {
  if (typeof window === "undefined") return;

  if (!("Notification" in window)) {
    console.warn("Notifications not supported");
    return;
  }

  if (Notification.permission === "granted") {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: "/android-chrome-192x192.png",
          badge: "/android-chrome-192x192.png",
          ...options,
        });
      });
    } else {
      new Notification(title, {
        icon: "/android-chrome-192x192.png",
        badge: "/android-chrome-192x192.png",
        ...options,
      });
    }
  }
}
