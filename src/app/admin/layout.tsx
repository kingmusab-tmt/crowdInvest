
"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  CreditCard,
  Settings,
  Mountain,
  Calendar,
  Building2,
  Bell,
  Store,
  HandHelping,
  Vote,
  PlusCircle,
  Banknote,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";

const navItems = [
    { href: "/admin", icon: Home, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/communities", icon: Building2, label: "Communities" },
    { href: "/admin/notifications", icon: Bell, label: "Notifications" },
];

const reviewNavItems = [
    { href: "/admin/events", icon: Calendar, label: "Events" },
    { href: "/admin/businesses", icon: Store, label: "Businesses" },
    { href: "/admin/assistance", icon: HandHelping, label: "Assistance" },
    { href: "/admin/withdrawals", icon: Banknote, label: "Withdrawals" },
    { href: "/admin/investments", icon: TrendingUp, label: "Investments" },
];

const votingNavItems = [
    { href: "/admin/proposals", icon: PlusCircle, label: "Create Proposal" },
]

const settingsNavItems = [
    { href: "/admin/transactions", icon: CreditCard, label: "Transactions" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
];

function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
           <Mountain className="h-6 w-6 text-primary" />
           <span className="font-semibold text-lg">CROWD Invest</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
             <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{
                      children: item.label,
                      side: "right",
                      align: "center",
                  }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarSeparator/>
         <SidebarMenu>
             <p className="px-4 py-2 text-xs text-muted-foreground font-semibold">Reviews</p>
          {reviewNavItems.map((item) => (
             <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{
                      children: item.label,
                      side: "right",
                      align: "center",
                  }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarSeparator/>
        <SidebarMenu>
             <p className="px-4 py-2 text-xs text-muted-foreground font-semibold">Voting</p>
          {votingNavItems.map((item) => (
             <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{
                      children: item.label,
                      side: "right",
                      align: "center",
                  }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarSeparator/>
        <SidebarMenu>
          {settingsNavItems.map((item) => (
             <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{
                      children: item.label,
                      side: "right",
                      align: "center",
                  }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}


function AdminHeader() {
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="shrink-0 md:hidden" />
          <div className="w-full flex-1">
            {/* Can add a search bar here */}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                 <Avatar>
                  <AvatarImage src="https://i.pravatar.cc/150?u=admin" alt="Admin" />
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
    );
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
        <AdminSidebar />
        <div className="flex flex-col w-full">
          <AdminHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background overflow-auto">
            {children}
          </main>
        </div>
    </SidebarProvider>
  );
}
