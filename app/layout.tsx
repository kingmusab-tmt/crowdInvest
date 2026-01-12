import type { Metadata } from "next";
import "./globals.css";
import ThemeRegistry from "@/components/ThemeRegistry";
import AuthProvider from "@/components/AuthProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import NotificationListener from "@/components/NotificationListener";

export const metadata: Metadata = {
  title: "CrowdInvest - Community Investment Platform",
  description:
    "Contribute together, Assist each other, Invest together, Grow together.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CROWD Invest",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#3399FF" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="CROWD Invest" />
        <link rel="apple-touch-icon" href="/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" href="/android-chrome-192x192.png" />
      </head>
      <body>
        <AuthProvider>
          <ServiceWorkerRegister />
          <PWAInstallPrompt />
          <NotificationListener />
          <ThemeRegistry>{children}</ThemeRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}
