
"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import {
  Home,
  DollarSign,
  Calendar,
  Mountain,
  PlusSquare,
  HandHelping,
  TrendingUp,
  Bell,
  Store,
  Vote,
  Banknote,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  SidebarFooter,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const navItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/dashboard/deposit", icon: DollarSign, label: "Deposit" },
    { href: "/dashboard/withdrawal", icon: Banknote, label: "Withdraw" },
    { href: "/dashboard/transactions", icon: CreditCard, label: "Transactions" },
    { href: "/dashboard/investments", icon: TrendingUp, label: "Investments" },
    { href: "/dashboard/member-businesses", icon: Store, label: "Member Businesses" },
    { href: "/dashboard/events", icon: Calendar, label: "Upcoming Events" },
    { href: "/dashboard/voting", icon: Vote, label: "Voting" },
    { href: "/dashboard/submit-event", icon: PlusSquare, label: "Submit Event" },
    { href: "/dashboard/assistance", icon: HandHelping, label: "Financial Assistance" },
];

function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
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
                  isActive={pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')}
                  tooltip={{
                      children: item.label,
                      side: "right",
                      align: "center",
                  }}
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
             <Card className="m-2">
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <p className="text-xs text-muted-foreground mb-2">Contact our support team for any questions.</p>
                <Button size="sm" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
      </SidebarFooter>
    </Sidebar>
  );
}

function DashboardHeader() {
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="shrink-0 md:hidden" />
          <div className="w-full flex-1">
            {/* Can add a search bar here */}
          </div>
          <Button variant="ghost" size="icon" className="relative rounded-full" asChild>
            <Link href="/dashboard/notifications">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">3</Badge>
              <span className="sr-only">Notifications</span>
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src="https://i.pravatar.cc/150" alt="User Avatar" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
    );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     <SidebarProvider>
        <DashboardSidebar />
        <div className="flex flex-col w-full">
          <DashboardHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background overflow-auto">
            {children}
          </main>
        </div>
    </SidebarProvider>
  );
}
