"use client";

import { useEffect, useState } from "react";

// Renders/unmounts the splash overlay through React state rather than
// imperative DOM calls (el.remove()) — mutating a React-rendered node
// directly desyncs the fiber tree from the real DOM and causes
// insertBefore/removeChild NotFoundErrors on the next React commit.
export default function AppSplashRemover() {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    setFadingOut(true);
    const timeout = setTimeout(() => setVisible(false), 400);
    return () => clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div id="app-splash" className={fadingOut ? "app-splash-hidden" : undefined}>
      <img
        src="/android-chrome-192x192.png"
        alt="CrowdInvest"
        width={96}
        height={96}
        fetchPriority="high"
      />
      <span className="app-splash-title">CrowdInvest</span>
    </div>
  );
}
