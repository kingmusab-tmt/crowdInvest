
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MoreHorizontal,
  PlusCircle,
  MinusCircle,
  Shield,
  ShieldOff,
  Star,
  UserX,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


type UserRole = "User" | "Community Admin" | "General Admin";
type UserStatus = "Active" | "Restricted";

type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  status: UserStatus;
  balance: number;
  isTopUser: boolean;
  dateJoined: string;
  community?: string;
};

const initialUsers: User[] = [
  { id: 'usr_1', name: 'Olivia Martin', email: 'olivia.martin@email.com', avatarUrl: 'https://i.pravatar.cc/150?u=a', role: 'User', status: 'Active', balance: 1250.75, isTopUser: true, dateJoined: '2024-07-15', community: 'Northside' },
  { id: 'usr_2', name: 'Jackson Lee', email: 'jackson.lee@email.com', avatarUrl: 'https://i.pravatar.cc/150?u=b', role: 'Community Admin', status: 'Active', balance: 750.00, isTopUser: false, dateJoined: '2024-07-14', community: 'Southside' },
  { id: 'usr_3', name: 'Liam Johnson', email: 'liam@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=c', role: 'User', status: 'Restricted', balance: 300.25, isTopUser: false, dateJoined: '2024-07-12', community: 'Northside' },
  { id: 'usr_4', name: 'Noah Williams', email: 'noah@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=d', role: 'Community Admin', status: 'Active', balance: 5000.00, isTopUser: true, dateJoined: '2024-07-10', community: 'Northside' },
  { id: 'usr_5', name: 'Admin User', email: 'admin@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=e', role: 'General Admin', status: 'Active', balance: 0.00, isTopUser: false, dateJoined: '2024-06-01' },
  { id: 'usr_6', name: 'Ethan Jones', email: 'ethan.jones@email.com', avatarUrl: 'https://i.pravatar.cc/150?u=f', role: 'User', status: 'Active', balance: 250.00, isTopUser: false, dateJoined: '2024-07-18', community: 'Southside' },
];

const communities = ["Northside", "Southside", "West End", "Downtown"];

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [isFundDialogOpen, setIsFundDialogOpen] = useState(false);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [fundAction, setFundAction] = useState<"add" | "debit">("add");
    const [fundAmount, setFundAmount] = useState("");
    const [selectedRole, setSelectedRole] = useState<UserRole>("User");
    const [selectedCommunity, setSelectedCommunity] = useState<string | undefined>(undefined);
    const { toast } = useToast();

    const openFundDialog = (user: User, action: "add" | "debit") => {
        setSelectedUser(user);
        setFundAction(action);
        setFundAmount("");
        setIsFundDialogOpen(true);
    };
    
    const handleFundAction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !fundAmount) return;

        const amount = parseFloat(fundAmount);
        setUsers(users.map(u => 
            u.id === selectedUser.id 
            ? { ...u, balance: fundAction === "add" ? u.balance + amount : u.balance - amount }
            : u
        ));
        toast({
            title: `Funds ${fundAction === "add" ? "Added" : "Debited"}`,
            description: `$${amount.toFixed(2)} has been ${fundAction === "add" ? "added to" : "debited from"} ${selectedUser.name}'s account.`,
        });
        setIsFundDialogOpen(false);
    };

    const handleToggleRestrict = (userId: string) => {
        const user = users.find(u => u.id === userId)!;
        const newStatus: UserStatus = user.status === "Active" ? "Restricted" : "Active";
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        toast({
            title: `User ${newStatus === "Restricted" ? "Restricted" : "Unrestricted"}`,
            description: `${user.name} has been ${newStatus === "Restricted" ? "restricted" : "unrestricted"}.`,
        });
    };
    
    const openRoleDialog = (user: User) => {
        setSelectedUser(user);
        setSelectedRole(user.role);
        setSelectedCommunity(user.community);
        setIsRoleDialogOpen(true);
    };

    const handleRoleChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        if (selectedUser.email === 'admin@example.com') {
             toast({ title: "Action Forbidden", description: "Cannot change the role of the default admin.", variant: "destructive" });
             setIsRoleDialogOpen(false);
             return;
        }

        const community = selectedRole === "Community Admin" ? selectedCommunity : undefined;
        setUsers(users.map(u => 
            u.id === selectedUser.id ? { ...u, role: selectedRole, community: community } : u
        ));

        toast({
            title: `User Role Changed`,
            description: `${selectedUser.name}'s role has been updated to ${selectedRole}.`,
        });
        setIsRoleDialogOpen(false);
    };


    const handleToggleTopUser = (userId: string) => {
        const user = users.find(u => u.id === userId)!;
        const newIsTopUser = !user.isTopUser;
        setUsers(users.map(u => u.id === userId ? { ...u, isTopUser: newIsTopUser } : u));
        toast({
            title: `User Highlight Updated`,
            description: `${user.name} has been ${newIsTopUser ? "marked as a top user" : "unmarked as a top user"}.`,
        });
    };

    const getRoleBadgeVariant = (role: UserRole) => {
        switch (role) {
            case 'General Admin': return 'default';
            case 'Community Admin': return 'secondary';
            default: return 'outline';
        }
    }

  return (
    <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Monitor and manage all registered users across communities.</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>A list of all users in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Community</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium flex items-center gap-2">
                                        {user.name}
                                        {user.isTopUser && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                                    </div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                            </TableCell>
                            <TableCell>
                                {user.community || 'N/A'}
                            </TableCell>
                            <TableCell>
                                <Badge variant={user.status === 'Active' ? 'secondary' : 'destructive'}>{user.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">${user.balance.toFixed(2)}</TableCell>
                            <TableCell className="text-center">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => openFundDialog(user, 'add')}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Funds
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openFundDialog(user, 'debit')}>
                                        <MinusCircle className="mr-2 h-4 w-4" />
                                        Debit Funds
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => openRoleDialog(user)}>
                                        <Shield className="mr-2 h-4 w-4" />
                                        Change Role
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => handleToggleRestrict(user.id)}>
                                        {user.status === 'Active' ? <UserX className="mr-2 h-4 w-4" /> : <Users className="mr-2 h-4 w-4" />}
                                        {user.status === 'Active' ? 'Restrict User' : 'Unrestrict User'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleTopUser(user.id)}>
                                        <Star className="mr-2 h-4 w-4" />
                                        {user.isTopUser ? 'Unmark Top User' : 'Mark as Top User'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Dialog open={isFundDialogOpen} onOpenChange={setIsFundDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{fundAction === 'add' ? 'Add Funds to' : 'Debit Funds from'} {selectedUser?.name}</DialogTitle>
                    <DialogDescription>
                        Enter the amount to {fundAction} {selectedUser?.name}'s account balance.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleFundAction}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="fund-amount" className="text-right">Amount</Label>
                             <div className="relative col-span-3">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                                <Input
                                    id="fund-amount"
                                    type="number"
                                    value={fundAmount}
                                    onChange={(e) => setFundAmount(e.target.value)}
                                    className="pl-7"
                                    placeholder="50.00"
                                    required
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsFundDialogOpen(false)}>Cancel</Button>
                        <Button type="submit">{fundAction === 'add' ? 'Add' : 'Debit'} Funds</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Role for {selectedUser?.name}</DialogTitle>
                    <DialogDescription>
                        Select a new role and community if applicable.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRoleChange}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">Role</Label>
                            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="User">User</SelectItem>
                                    <SelectItem value="Community Admin">Community Admin</SelectItem>
                                    <SelectItem value="General Admin">General Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedRole === 'Community Admin' && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="community" className="text-right">Community</Label>
                                <Select value={selectedCommunity} onValueChange={setSelectedCommunity}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a community" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {communities.map(community => (
                                            <SelectItem key={community} value={community}>{community}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}

    