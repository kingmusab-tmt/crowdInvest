
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Trash2, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Community = {
  id: number;
  name: string;
  description: string;
  memberCount: number;
};

const initialCommunities: Community[] = [
  {
    id: 1,
    name: "Northside",
    description: "The vibrant community in the northern district.",
    memberCount: 152,
  },
  {
    id: 2,
    name: "Southside",
    description: "A close-knit community known for its annual festivals.",
    memberCount: 98,
  },
  {
    id: 3,
    name: "West End",
    description: "Home to the city's arts and culture scene.",
    memberCount: 213,
  },
  {
    id: 4,
    name: "Downtown",
    description: "The central hub for business and urban living.",
    memberCount: 305,
  },
];

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>(initialCommunities);
  const [isNewCommunityDialogOpen, setIsNewCommunityDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateCommunity = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const newCommunity: Community = {
      id: Math.max(0, ...communities.map(c => c.id)) + 1,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      memberCount: 0,
    };
    
    setCommunities([newCommunity, ...communities]);
    setIsNewCommunityDialogOpen(false);
    toast({ title: "Community Created", description: `"${newCommunity.name}" has been successfully created.` });
  };

  const handleDeleteCommunity = (communityId: number) => {
    const communityToDelete = communities.find(c => c.id === communityId);
    setCommunities(communities.filter((community) => community.id !== communityId));
    toast({
      title: "Community Deleted",
      description: `"${communityToDelete?.name}" has been deleted.`,
      variant: "destructive",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Community Management</h1>
          <p className="text-muted-foreground">Create and manage communities for your users.</p>
        </div>
        <Dialog open={isNewCommunityDialogOpen} onOpenChange={setIsNewCommunityDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Community
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Community</DialogTitle>
              <DialogDescription>Fill in the details for the new community.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCommunity}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" name="name" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">Description</Label>
                  <Textarea id="description" name="description" className="col-span-3" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Community</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>All Communities</CardTitle>
            <CardDescription>A list of all communities in the system.</CardDescription>
        </CardHeader>
        <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Members</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {communities.map((community) => (
                    <TableRow key={community.id}>
                        <TableCell className="font-medium">{community.name}</TableCell>
                        <TableCell className="text-muted-foreground">{community.description}</TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{community.memberCount}</span>
                            </div>
                        </TableCell>
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
                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCommunity(community.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
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
    </div>
  );
}
