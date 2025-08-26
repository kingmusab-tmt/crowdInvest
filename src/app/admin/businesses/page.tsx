
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, CheckCircle, XCircle, Star, Phone, Mail, MessageSquare, Vote } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import Image from "next/image";

type BusinessStatus = "Pending" | "Approved" | "Rejected";

type Business = {
  id: number;
  name: string;
  ownerName: string;
  ownerEmail: string;
  type: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  whatsapp?: string;
  seekingInvestment: boolean;
  imageUrl: string;
  imageHint: string;
  status: BusinessStatus;
};

const initialBusinesses: Business[] = [
  {
    id: 1,
    name: "Olivia's Artisan Bakery",
    ownerName: "Olivia Martin",
    ownerEmail: "olivia.martin@email.com",
    type: "Product-Based",
    location: "123 Main St, Northside",
    contactEmail: "contact@bakery.com",
    contactPhone: "+1 234 567 890",
    seekingInvestment: true,
    imageUrl: "https://picsum.photos/600/400?random=10",
    imageHint: "artisan bakery",
    status: "Pending",
  },
  {
    id: 2,
    name: "Lee Web Solutions",
    ownerName: "Jackson Lee",
    ownerEmail: "jackson.lee@email.com",
    type: "Service-Based",
    location: "Remote",
    contactEmail: "jackson@leeweb.dev",
    contactPhone: "+1 987 654 321",
    whatsapp: "+1 987 654 321",
    seekingInvestment: false,
    imageUrl: "https://picsum.photos/600/400?random=11",
    imageHint: "web development",
    status: "Approved",
  },
  {
    id: 3,
    name: "Noah's GardenScapes",
    ownerName: "Noah Williams",
    ownerEmail: "noah@example.com",
    type: "Service-Based",
    location: "456 Oak Ave, Northside",
    contactEmail: "noah@gardenscapes.com",
    contactPhone: "+1 555 123 456",
    seekingInvestment: true,
    imageUrl: "https://picsum.photos/600/400?random=12",
    imageHint: "landscaping garden",
    status: "Rejected",
  },
];

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  const { toast } = useToast();

  const handleStatusChange = (businessId: number, newStatus: BusinessStatus) => {
    const businessToUpdate = businesses.find(b => b.id === businessId);
    if (!businessToUpdate) return;
    
    setBusinesses(
      businesses.map((business) =>
        business.id === businessId ? { ...business, status: newStatus } : business
      )
    );
    
    toast({
      title: `Business ${newStatus}`,
      description: `"${businessToUpdate.name}" has been ${newStatus.toLowerCase()}.`,
    });
  };
  
  const getStatusBadgeVariant = (status: BusinessStatus) => {
    switch (status) {
        case 'Approved': return 'secondary';
        case 'Rejected': return 'destructive';
        default: return 'outline';
    }
  }

  const handlePushToVoting = (business: Business) => {
    toast({
      title: "Pushed to Voting",
      description: `A proposal to invest in "${business.name}" has been created.`,
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Member Business Review</h1>
        <p className="text-muted-foreground">Approve or reject business submissions from community members.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>A list of all member business submissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image src={business.imageUrl} alt={business.name} width={40} height={40} className="rounded-sm object-cover" data-ai-hint={business.imageHint} />
                      <div>
                        <div className="font-medium">{business.name}</div>
                        <div className="text-sm text-muted-foreground">{business.location}</div>
                        {business.seekingInvestment && <Badge variant="default" className="mt-1 gap-1"><Star className="h-3 w-3" /> Seeking Investment</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="font-medium">{business.ownerName}</div>
                     <div className="text-sm text-muted-foreground">{business.ownerEmail}</div>
                  </TableCell>
                   <TableCell>
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" /> <span>{business.contactEmail}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" /> <span>{business.contactPhone}</span>
                     </div>
                     {business.whatsapp && <div className="flex items-center gap-2 text-sm text-muted-foreground"><MessageSquare className="h-4 w-4" /> <span>{business.whatsapp}</span></div>}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusBadgeVariant(business.status)}>{business.status}</Badge>
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
                        {business.status === 'Pending' && (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusChange(business.id, 'Approved')}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(business.id, 'Rejected')}>
                              <XCircle className="mr-2 h-4 w-4 text-red-500" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {business.status === 'Approved' && business.seekingInvestment && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handlePushToVoting(business)}>
                              <Vote className="mr-2 h-4 w-4" />
                              Push for Investment Vote
                            </DropdownMenuItem>
                          </>
                        )}
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
