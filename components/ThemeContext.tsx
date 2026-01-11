"use client";

import React, { createContext, useContext, useCallback } from "react";

interface ThemeContextType {
  refreshTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [, setRefreshTrigger] = React.useState(0);

  const refreshTheme = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <ThemeContext.Provider value={{ refreshTheme }}>
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
