"use client";

import * as React from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useTheme } from "@mui/material/styles";
import { useSession } from "next-auth/react";
import { useThemeRefresh } from "./ThemeContext";

export default function DarkModeToggle() {
  const theme = useTheme();
  const { update: updateSession } = useSession();
  const { refreshTheme } = useThemeRefresh();
  const [toggling, setToggling] = React.useState(false);

  const isDark = theme.palette.mode === "dark";

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);

    const nextTheme = isDark ? "light" : "dark";

    try {
      await fetch("/api/users/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: nextTheme }),
      });

      if (updateSession) {
        await updateSession();
      }

      refreshTheme();
    } catch (error) {
      console.error("Failed to update theme preference", error);
    } finally {
      setToggling(false);
    }
  };

  return (
    <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <span>
        <IconButton
          color="inherit"
          onClick={handleToggle}
          disabled={toggling}
          aria-label="toggle dark mode"
        >
          {isDark ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </span>
    </Tooltip>
  );
}
