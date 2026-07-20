"use client";

import React, { createContext, useContext, useCallback } from "react";

interface ThemeContextType {
  refreshTheme: () => void;
  refreshTrigger: number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const refreshTheme = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <ThemeContext.Provider value={{ refreshTheme, refreshTrigger }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeRefresh() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeRefresh must be used within ThemeContextProvider");
  }
  return context;
}
