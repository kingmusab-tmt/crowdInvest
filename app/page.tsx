import type { Metadata } from "next";
import HomePage from "./HomePage";

// Intentionally static: the public landing page's branding must never change
// based on admin-configured platform settings (see app/layout.tsx generateMetadata).
export const metadata: Metadata = {
  title: "CrowdInvest - Community Investment Platform",
  description:
    "Contribute together, Assist each other, Invest together, Grow together.",
};

export default function Page() {
  return <HomePage />;
}
