
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mountain, Fingerprint } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { createOrRetrieveUserFromGoogle, signInWithEmail } from "@/services/userService";
import { useState } from "react";

const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25C22.56 11.45 22.49 10.68 22.36 9.92H12.27V14.5H18.2C17.92 16.03 17.07 17.34 15.82 18.13V20.75H19.45C21.45 18.93 22.56 15.93 22.56 12.25Z" fill="#4285F4"/>
        <path d="M12.27 23C15.14 23 17.58 22.09 19.45 20.75L15.82 18.13C14.83 18.79 13.63 19.18 12.27 19.18C9.55 19.18 7.24 17.38 6.35 14.99L2.6 17.65C4.48 21.04 8.08 23 12.27 23Z" fill="#34A853"/>
        <path d="M6.35 14.99C6.13 14.39 6.02 13.75 6.02 13.1C6.02 12.45 6.13 11.81 6.35 11.21V8.63L2.6 5.96C1.65 7.86 1 10.35 1 13.1C1 15.85 1.65 18.34 2.6 20.24L6.35 17.59V14.99Z" fill="#FBBC05"/>
        <path d="M12.27 7.02C13.78 7.02 15.22 7.55 16.3 8.56L19.53 5.34C17.58 3.55 15.14 2.5 12.27 2.5C8.08 2.5 4.48 4.96 2.6 8.35L6.35 11.01C7.24 8.62 9.55 7.02 12.27 7.02Z" fill="#EA4335"/>
    </svg>
);


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await createOrRetrieveUserFromGoogle(user);
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.displayName}!`,
      });
      router.push('/dashboard');
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      toast({
        title: "Login Failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
        const user = await signInWithEmail(email, password);
        toast({
            title: "Login Successful",
            description: `Welcome back, ${user.displayName || user.email}!`,
        });
        router.push('/dashboard');
    } catch (error) {
        console.error("Email Sign-In Error:", error);
        toast({
            title: "Login Failed",
            description: "Invalid email or password. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl">
                <Mountain className="h-8 w-8 text-primary" />
                <span>CROWD Invest</span>
            </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="m@example.com" required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="ml-auto inline-block text-sm underline" prefetch={false}>
                    Forgot your password?
                  </Link>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>
               <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Button>
            </form>
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={handleGoogleSignIn}>
                    <GoogleIcon /> Google
                </Button>
                <Button variant="outline">
                    <Fingerprint /> Fingerprint
                </Button>
            </div>
             <div className="mt-6 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline" prefetch={false}>
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
