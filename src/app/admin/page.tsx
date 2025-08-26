
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, DollarSign, Users, Activity, Building2 } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Mock data - in a real app, this would come from a database
const communities = [
  { name: "Northside" },
  { name: "Southside" },
  { name: "West End" },
  { name: "Downtown" },
];

const users = [
  { community: 'Northside', role: 'User', balance: 1250.75 },
  { community: 'Southside', role: 'Community Admin', balance: 750.00 },
  { community: 'Northside', role: 'User', balance: 300.25 },
  { community: 'Northside', role: 'Community Admin', balance: 5000.00 },
  { community: 'Southside', role: 'User', balance: 250.00 },
];

const recentUsers = [
    { name: 'Olivia Martin', email: 'olivia.martin@email.com', avatarUrl: 'https://i.pravatar.cc/150?u=a', dateJoined: '2024-07-15' },
    { name: 'Jackson Lee', email: 'jackson.lee@email.com', avatarUrl: 'https://i.pravatar.cc/150?u=b', dateJoined: '2024-07-14' },
]

const recentTransactions = [
    { name: 'Liam Johnson', email: 'liam@example.com', amount: 250.00 },
    { name: 'Noah Williams', email: 'noah@example.com', amount: 150.00 },
]

const communityStats = communities.map(community => {
    const communityUsers = users.filter(u => u.community === community.name);
    const userCount = communityUsers.length;
    const adminCount = communityUsers.filter(u => u.role === 'Community Admin').length;
    const totalBalance = communityUsers.reduce((sum, u) => sum + u.balance, 0);
    return {
        name: community.name,
        userCount,
        adminCount,
        totalBalance,
    };
});


export default function AdminDashboardPage() {
  const totalRevenue = users.reduce((sum, user) => sum + user.balance, 0);
  const totalUsers = users.length;

  return (
    <div className="flex flex-col gap-4">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funds</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
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
            <div className="text-2xl font-bold">{communities.length}</div>
            <p className="text-xs text-muted-foreground">Actively managed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+3</div>
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
                            <TableCell>{user.dateJoined}</TableCell>
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
                        <TableRow key={transaction.email}>
                          <TableCell>
                              <p className="font-medium">{transaction.name}</p>
                              <p className="text-sm text-muted-foreground">{transaction.email}</p>
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
