import type { Metadata } from "next";
import "./globals.css";
import ThemeRegistry from "@/components/ThemeRegistry";
import AuthProvider from "@/components/AuthProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import NotificationListener from "@/components/NotificationListener";
import AppSplashRemover from "@/components/AppSplashRemover";
import { PlatformSettingsProvider } from "@/components/PlatformSettingsContext";
import dbConnect from "@/utils/connectDB";
import { getPlatformSettings } from "@/utils/getPlatformSettings";

export async function generateMetadata(): Promise<Metadata> {
  let platformName = "CrowdInvest";
  let tagline =
    "Contribute together, Assist each other, Invest together, Grow together.";

  try {
    await dbConnect();
    const settings = await getPlatformSettings();
    platformName = settings.platformName || platformName;
    tagline = settings.tagline || tagline;
  } catch (error) {
    console.error("Failed to load platform settings for metadata:", error);
  }

  return {
    title: `${platformName} - Community Investment Platform`,
    description: tagline,
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: platformName,
    },
    formatDetection: {
      telephone: false,
    },
  };
}

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
        <link rel="apple-touch-icon" href="/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" href="/android-chrome-192x192.png" />
      </head>
      <body>
        {/* Static markup so it paints before JS hydrates; hidden outside
            standalone (installed) mode via CSS, no JS needed for that. */}
        <div id="app-splash">
          <img
            src="/android-chrome-192x192.png"
            alt="CrowdInvest"
            width={96}
            height={96}
            fetchPriority="high"
          />
          <span className="app-splash-title">CrowdInvest</span>
        </div>
        <AppSplashRemover />
        <AuthProvider>
          <PlatformSettingsProvider>
            <ServiceWorkerRegister />
            <PWAInstallPrompt />
            <NotificationListener />
            <ThemeRegistry>{children}</ThemeRegistry>
          </PlatformSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
