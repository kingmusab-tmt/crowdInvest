import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      role?: string | null;
      image: string | null;
      isActive: boolean | null;
      id: string | null;
      profileCompleted: boolean | null;
    } & DefaultSession["user"];
  }
  interface Session {
    id: string | null;
    role: string | null;
    image: string | null;
    isActive: boolean | null;
    profileCompleted: boolean | null;
  }

  interface User {
    id: string | null;
    role: string | null;
    image: string | null;
    isActive: boolean | null;
    profileCompleted: boolean | null;
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id: string | null;
    role: string | null;
    image: string | null;
    isActive: boolean | null;
    profileCompleted: boolean | null;
  }
}
