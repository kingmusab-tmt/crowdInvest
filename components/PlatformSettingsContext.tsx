"use client";

import * as React from "react";

export interface PublicPlatformSettings {
  platformName: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  currencyCode: string;
  currencySymbol: string;
  footerText?: string;
  minimumContribution: number;
  minimumWithdrawal: number;
  enabledInvestmentTypes: string[];
  legal: {
    termsAndConditions: string;
    privacyPolicy: string;
    maintenanceMode: boolean;
    maintenanceMessage?: string;
  };
  appearance: {
    primaryColor: string;
    secondaryColor: string;
  };
}

const DEFAULT_SETTINGS: PublicPlatformSettings = {
  platformName: "CrowdInvest",
  currencyCode: "NGN",
  currencySymbol: "₦",
  minimumContribution: 0,
  minimumWithdrawal: 0,
  enabledInvestmentTypes: [],
  legal: {
    termsAndConditions: "",
    privacyPolicy: "",
    maintenanceMode: false,
  },
  appearance: {
    primaryColor: "#1976d2",
    secondaryColor: "#dc004e",
  },
};

interface PlatformSettingsContextType {
  settings: PublicPlatformSettings;
  loading: boolean;
  refetch: () => void;
}

const PlatformSettingsContext = React.createContext<
  PlatformSettingsContextType | undefined
>(undefined);

export function PlatformSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] =
    React.useState<PublicPlatformSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = React.useState(true);

  const fetchSettings = React.useCallback(async () => {
    try {
      const res = await fetch("/api/settings/public");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to load platform settings", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <PlatformSettingsContext.Provider
      value={{ settings, loading, refetch: fetchSettings }}
    >
      {children}
    </PlatformSettingsContext.Provider>
  );
}

export function usePlatformSettings() {
  const context = React.useContext(PlatformSettingsContext);
  if (!context) {
    throw new Error(
      "usePlatformSettings must be used within a PlatformSettingsProvider"
    );
  }
  return context;
}
