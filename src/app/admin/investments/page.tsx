
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Trash2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { getInvestments, createInvestment, deleteInvestment, updateInvestment, Investment, InvestmentStatus, RiskLevel } from "@/services/investmentService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminInvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewInvestmentDialogOpen, setIsNewInvestmentDialogOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const fetchedInvestments = await getInvestments();
        setInvestments(fetchedInvestments);
      } catch (error) {
        console.error("Failed to fetch investments:", error);
        toast({
          title: "Error",
          description: "Failed to load investment data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInvestments();
  }, [toast]);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const investmentData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      longDescription: formData.get("longDescription") as string,
      amount: parseFloat(formData.get("amount") as string),
      goal: parseFloat(formData.get("goal") as string),
      investors: parseInt(formData.get("investors") as string),
      status: formData.get("status") as InvestmentStatus,
      projectedROI: formData.get("projectedROI") as string,
      term: formData.get("term") as string,
      risk: formData.get("risk") as RiskLevel,
      imageUrl: formData.get("imageUrl") as string,
      imageHint: formData.get("imageHint") as string,
    };

    try {
      if (editingInvestment) {
        // Update existing investment
        const updatedInvestment = { ...editingInvestment, ...investmentData, progress: Math.round((investmentData.amount / investmentData.goal) * 100) };
        await updateInvestment(editingInvestment.id, updatedInvestment);
        setInvestments(investments.map(inv => inv.id === editingInvestment.id ? updatedInvestment : inv));
        toast({ title: "Investment Updated", description: `"${updatedInvestment.title}" has been updated.` });
      } else {
        // Create new investment
        const newInvestmentData = { ...investmentData, progress: Math.round((investmentData.amount / investmentData.goal) * 100) };
        const newInvestment = await createInvestment(newInvestmentData);
        setInvestments([newInvestment, ...investments]);
        toast({ title: "Investment Created", description: `"${newInvestment.title}" has been created.` });
      }
      closeDialog();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save investment.", variant: "destructive" });
    }
  };

  const handleDeleteInvestment = async (investmentId: string) => {
    const investmentToDelete = investments.find(e => e.id === investmentId);
    if (!investmentToDelete) return;
    try {
        await deleteInvestment(investmentId);
        setInvestments(investments.filter((inv) => inv.id !== investmentId));
        toast({
          title: "Investment Deleted",
          description: `"${investmentToDelete?.title}" has been deleted.`,
          variant: "destructive",
        });
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete investment.", variant: "destructive" });
    }
  };

  const openEditDialog = (investment: Investment) => {
    setEditingInvestment(investment);
    setIsNewInvestmentDialogOpen(true);
  };
  
  const openNewDialog = () => {
    setEditingInvestment(null);
    setIsNewInvestmentDialogOpen(true);
  };

  const closeDialog = () => {
    setEditingInvestment(null);
    setIsNewInvestmentDialogOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Investment Management</h1>
          <p className="text-muted-foreground">Create, monitor, and manage community investments.</p>
        </div>
        <Dialog open={isNewInvestmentDialogOpen} onOpenChange={setIsNewInvestmentDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Investment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingInvestment ? 'Edit Investment' : 'Create New Investment'}</DialogTitle>
              <DialogDescription>Fill in the details for the investment opportunity.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFormSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Title</Label>
                  <Input id="title" name="title" className="col-span-3" required defaultValue={editingInvestment?.title} />
                </div>
                 <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">Short Desc.</Label>
                  <Textarea id="description" name="description" className="col-span-3" required defaultValue={editingInvestment?.description} />
                </div>
                 <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="longDescription" className="text-right pt-2">Full Desc.</Label>
                  <Textarea id="longDescription" name="longDescription" className="col-span-3" rows={5} required defaultValue={editingInvestment?.longDescription} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Amount Raised</Label><Input name="amount" type="number" placeholder="15000" required defaultValue={editingInvestment?.amount}/></div>
                    <div><Label>Goal</Label><Input name="goal" type="number" placeholder="20000" required defaultValue={editingInvestment?.goal}/></div>
                    <div><Label>Investors</Label><Input name="investors" type="number" placeholder="42" required defaultValue={editingInvestment?.investors}/></div>
                    <div>
                        <Label>Status</Label>
                        <Select name="status" defaultValue={editingInvestment?.status || 'Active'} required>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Funded">Funded</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label>Projected ROI</Label>
                        <Input name="projectedROI" placeholder="18%" required defaultValue={editingInvestment?.projectedROI} />
                    </div>
                     <div>
                        <Label>Term</Label>
                        <Input name="term" placeholder="3 Years" required defaultValue={editingInvestment?.term} />
                    </div>
                     <div>
                        <Label>Risk Level</Label>
                         <Select name="risk" defaultValue={editingInvestment?.risk || 'Medium'} required>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div>
                    <Label>Image URL</Label>
                    <Input name="imageUrl" placeholder="https://picsum.photos/..." required defaultValue={editingInvestment?.imageUrl}/>
                </div>
                 <div>
                    <Label>Image AI Hint</Label>
                    <Input name="imageHint" placeholder="e.g. tech startup" required defaultValue={editingInvestment?.imageHint}/>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button type="submit">{editingInvestment ? 'Save Changes' : 'Create Investment'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
            <p>Loading investments...</p>
        ) : investments.map((investment) => (
          <Card key={investment.id} className="flex flex-col overflow-hidden">
             <div className="relative">
                <Image
                    src={investment.imageUrl}
                    alt={investment.title}
                    width={600}
                    height={400}
                    className="w-full h-48 object-cover"
                    data-ai-hint={investment.imageHint}
                />
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="mb-1">{investment.title}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => openEditDialog(investment)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteInvestment(investment.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">${investment.amount.toLocaleString()} / ${investment.goal.toLocaleString()}</p>
                <Badge variant={investment.status === 'Completed' ? 'secondary' : 'default'}>{investment.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{investment.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
