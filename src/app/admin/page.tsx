
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, DollarSign, Users, Activity, Building2 } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

import { Community, getCommunities } from "@/services/communityService";
import { User, getUsers } from "@/services/userService";
import { Transaction, getTransactions } from "@/services/transactionService";
import { Event, getEvents } from "@/services/eventService";

type CommunityStat = {
  name: string;
  userCount: number;
  adminCount: number;
  totalBalance: number;
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [totalFunds, setTotalFunds] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCommunities, setTotalCommunities] = useState(0);
  const [activeEvents, setActiveEvents] = useState(0);
  const [communityStats, setCommunityStats] = useState<CommunityStat[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [communities, users, transactions, events] = await Promise.all([
          getCommunities(),
          getUsers(),
          getTransactions(),
          getEvents(),
        ]);

        // Calculate stats
        const funds = users.reduce((sum, user) => sum + user.balance, 0);
        setTotalFunds(funds);
        setTotalUsers(users.length);
        setTotalCommunities(communities.length);
        
        const upcomingEvents = events.filter(e => e.status === 'Upcoming' || e.status === 'Planning').length;
        setActiveEvents(upcomingEvents);

        const stats = communities.map(community => {
          const communityUsers = users.filter(u => u.community === community.name);
          return {
            name: community.name,
            userCount: communityUsers.length,
            adminCount: communityUsers.filter(u => u.role === 'Community Admin').length,
            totalBalance: communityUsers.reduce((sum, u) => sum + u.balance, 0),
          };
        });
        setCommunityStats(stats);
        
        const sortedUsers = [...users].sort((a, b) => new Date(b.dateJoined).getTime() - new Date(a.dateJoined).getTime());
        setRecentUsers(sortedUsers.slice(0, 2));

        const depositTransactions = transactions.filter(t => t.type === 'Deposit' && t.status === 'Completed');
        setRecentTransactions(depositTransactions.slice(0, 2));

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  if (loading) {
    return (
       <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader><Skeleton className="h-5 w-2/5" /></CardHeader><CardContent><Skeleton className="h-8 w-3/5" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-5 w-2/5" /></CardHeader><CardContent><Skeleton className="h-8 w-3/5" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-5 w-2/5" /></CardHeader><CardContent><Skeleton className="h-8 w-3/5" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-5 w-2/5" /></CardHeader><CardContent><Skeleton className="h-8 w-3/5" /></CardContent></Card>
        </div>
        <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4"><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
          <Card className="lg:col-span-3"><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funds</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFunds.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <p className="text-xs text-muted-foreground">Across all communities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Across all communities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Communities</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCommunities}</div>
            <p className="text-xs text-muted-foreground">Actively managed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{activeEvents}</div>
             <p className="text-xs text-muted-foreground">Upcoming this month</p>
          </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>Community Overview</CardTitle>
                <CardDescription>A summary of all communities in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Community Name</TableHead>
                            <TableHead className="text-center">Users</TableHead>
                            <TableHead className="text-center">Admins</TableHead>
                            <TableHead className="text-right">Total Funds</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {communityStats.map((stat) => (
                        <TableRow key={stat.name}>
                            <TableCell className="font-medium">{stat.name}</TableCell>
                            <TableCell className="text-center">{stat.userCount}</TableCell>
                            <TableCell className="text-center">{stat.adminCount}</TableCell>
                            <TableCell className="text-right font-mono">${stat.totalBalance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
         <Card className="lg:col-span-4">
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>
                    List of users who recently joined.
                </CardDescription>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/admin/users">
                    View All
                    <ArrowUpRight className="h-4 w-4" />
                </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Date Joined</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentUsers.map(user => (
                        <TableRow key={user.email}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatarUrl} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{user.name}</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{new Date(user.dateJoined).toLocaleDateString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Recent deposits from users.
            </CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                     {recentTransactions.map(transaction => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                              <p className="font-medium">{transaction.userName}</p>
                              <p className="text-sm text-muted-foreground">{transaction.userEmail}</p>
                          </TableCell>
                          <TableCell className="text-right font-medium">+${transaction.amount.toFixed(2)}</TableCell>
                      </TableRow>
                     ))}
                  </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    