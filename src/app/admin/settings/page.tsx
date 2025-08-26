
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Fingerprint, Bell, Palette, User, KeyRound, Save, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function AdminSettingsPage() {
  const { toast } = useToast();

  const handleSettingsSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({
      title: "Settings Saved",
      description: "Your admin preferences have been updated successfully.",
    });
  };

  return (
    <div>
       <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">Manage your administrator account and global settings.</p>
      </div>
      <form onSubmit={handleSettingsSave}>
        <div className="grid gap-8">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User /> Admin Profile</CardTitle>
                <CardDescription>Update your personal administrator details here.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="https://i.pravatar.cc/150?u=admin" alt="Admin Avatar" />
                      <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                     <div className="flex-1 space-y-2">
                        <Label htmlFor="profile-picture">Profile Picture</Label>
                        <Input id="profile-picture" type="file" className="text-muted-foreground"/>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue="Admin User" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" defaultValue="admin@example.com" disabled />
                    </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><KeyRound /> Security</CardTitle>
                <CardDescription>Manage your password and security settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                    </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="biometric-login" className="text-base flex items-center gap-2"><Fingerprint /> Enable Biometric Login</Label>
                        <p className="text-sm text-muted-foreground">
                            Use your fingerprint or face to log in faster to the admin dashboard.
                        </p>
                    </div>
                    <Switch id="biometric-login" />
                </div>
              </CardContent>
            </Card>

             {/* Appearance Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Palette /> Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of your admin dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Label className="text-base">Theme</Label>
                    <p className="text-sm text-muted-foreground mb-4">Select the theme for your dashboard.</p>
                     <RadioGroup defaultValue="system" className="grid grid-cols-3 gap-4">
                        <div>
                            <RadioGroupItem value="light" id="light" className="peer sr-only" />
                            <Label htmlFor="light" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                Light
                            </Label>
                        </div>
                         <div>
                            <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                            <Label htmlFor="dark" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                Dark
                            </Label>
                        </div>
                         <div>
                            <RadioGroupItem value="system" id="system" className="peer sr-only" />
                            <Label htmlFor="system" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                System
                            </Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell /> Admin Notifications</CardTitle>
                <CardDescription>Choose what you want to be notified about as an administrator.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                          <Label className="text-base">New User Signups</Label>
                          <p className="text-sm text-muted-foreground">Receive an email when a new user signs up and requires verification.</p>
                      </div>
                      <Checkbox defaultChecked />
                  </div>
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                          <Label className="text-base">New Submissions</Label>
                          <p className="text-sm text-muted-foreground">Get notified for new business, event, or assistance requests.</p>
                      </div>
                      <Checkbox defaultChecked />
                  </div>
                   <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                          <Label className="text-base">Withdrawal Requests</Label>
                          <p className="text-sm text-muted-foreground">Receive an email whenever a user requests to withdraw funds.</p>
                      </div>
                      <Checkbox defaultChecked />
                  </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                 <Button type="submit">
                    <Save className="mr-2" />
                    Save Changes
                </Button>
              </CardFooter>
            </Card>
        </div>
      </form>
    </div>
  );
}
