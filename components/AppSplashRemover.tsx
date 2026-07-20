"use client";

import { useEffect } from "react";

export default function AppSplashRemover() {
  useEffect(() => {
    const el = document.getElementById("app-splash");
    if (!el) return;

    el.classList.add("app-splash-hidden");
    const timeout = setTimeout(() => el.remove(), 400);
    return () => clearTimeout(timeout);
  }, []);

  return null;
}
