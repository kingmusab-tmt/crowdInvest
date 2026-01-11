"use client";

import * as React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { getTheme } from "@/app/theme";
import { useSession } from "next-auth/react";
import { ThemeContextProvider } from "./ThemeContext";

function ThemeProviderContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [mounted, setMounted] = React.useState(false);
  const [mode, setMode] = React.useState<"light" | "dark" | "system">("light");
  const [systemPreference, setSystemPreference] = React.useState<
    "light" | "dark"
  >("light");
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Effect to set mounted and detect system preference
  React.useEffect(() => {
    setMounted(true);

    // Detect system preference
    if (typeof window !== "undefined") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setSystemPreference(isDark ? "dark" : "light");

      // Listen for system preference changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemPreference(e.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  // Effect to update theme when session changes
  React.useEffect(() => {
    if (mounted) {
      const userTheme = (session?.user as any)?.settings?.theme || "light";
      setMode(userTheme);
    }
  }, [session, mounted, refreshTrigger]);

  // Determine the actual theme mode based on user preference
  const getActualMode = (): "light" | "dark" => {
    if (mode === "system") {
      return systemPreference;
    }
    return mode as "light" | "dark";
  };

  const theme = React.useMemo(
    () => getTheme(getActualMode()),
    [mode, systemPreference]
  );

  // Don't render children until hydration is complete to prevent mismatch
  if (!mounted) {
    return (
      <ThemeProvider theme={getTheme("light")}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeContextProvider>
      <ThemeProviderContent>{children}</ThemeProviderContent>
    </ThemeContextProvider>
  );
}
