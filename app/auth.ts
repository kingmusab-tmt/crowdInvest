import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import connectDB from "@/utils/connectDB";
import clientPromise from "@/utils/mongoConnect";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { NextAuthOptions, SessionStrategy } from "next-auth";
import { logFailedLogin, logSuccessfulLogin } from "@/utils/auditLogger";

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET!,
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      async profile(profile) {
        return {
          id: profile.sub,
          username: profile.sub,
          email: profile.email,
          emailVerified: profile.email_verified,
          name: profile.name,
          image: profile.picture,
          emailToken: null,
          isActive: true,
          role: "User",
          profileCompleted: false,
        };
      },
      httpOptions: {
        timeout: 10000,
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize(credentials): Promise<any> {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };
        try {
          await connectDB();
          const user = await User.findOne({ email });
          if (!user) {
            // Log failed login attempt - user not found
            await logFailedLogin(email, "User not found");
            throw new Error("Invalid email or password");
          }
          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            // Log failed login attempt - invalid password
            await logFailedLogin(email, "Invalid password");
            throw new Error("Invalid email or password");
          }

          // Log successful login
          await logSuccessfulLogin(user.id, user.email, user.name, user.role);

          return user;
        } catch (error) {
          // Log general authentication error if not already logged
          if (
            error instanceof Error &&
            error.message === "Invalid email or password"
          ) {
            throw error;
          }
          await logFailedLogin(email, "Authentication error");
          throw new Error("Invalid email or password");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 1 * 60 * 60, // 1 hour
    updateAge: 1 * 60, // 1 minute
  },
  pages: {
    error: "/auth/error",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard by default
      // The user role-based routing will be handled client-side in middleware or page redirects
      return baseUrl + "/dashboard";
    },

    async jwt({ token, trigger, session, user }) {
      // Log only on initial authentication (user object only exists on first JWT creation)
      // For Credentials: logging already happens in authorize callback
      // For OAuth (Google): this is the only place we get the user object on first auth
      if (user && !token.loggedAt) {
        // Only log if we haven't already logged this token
        console.log("🔐 [AUTH JWT] User authenticated:", user.email);
        if (user.id && user.email && user.name && user.role) {
          await logSuccessfulLogin(user.id, user.email, user.name, user.role);
        }
        // Mark that we've logged this token to avoid duplicate logs
        token.loggedAt = new Date().getTime();
      }

      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.id = user.id;
        token.image = user.image;
        token.isActive = user.isActive;
        token.role = user.role;
        token.profileCompleted = user.profileCompleted;
      } else {
        // Always sync latest user data from database to ensure token is up-to-date
        // This ensures changes to role, profileCompleted, etc. are reflected in the token
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.id = dbUser._id;
            token.image = dbUser.avatarUrl;
            token.isActive = dbUser.status === "Active";
            token.role = dbUser.role;
            token.profileCompleted = dbUser.profileCompleted;
          }
        } catch (error) {
          console.error("❌ [AUTH JWT] Error syncing user data:", error);
          // Continue with existing token data if database sync fails
        }
      }
      return token;
    },
    async session({ session, token }) {
      try {
        await connectDB();
        const userEmail = session?.user?.email;
        const dbUser = await User.findOne({ email: userEmail });

        if (dbUser) {
          session.user.email = dbUser.email;
          session.user.name = dbUser.name;
          session.user.id = dbUser.id;
          session.user.image = dbUser.image;
          session.user.isActive = dbUser.isActive;
          session.user.role = dbUser.role;
          session.user.profileCompleted = dbUser.profileCompleted;
        } else {
          session.user.email = token.email;
          session.user.name = token.name;
          session.user.id = token.id;
          session.user.image = token.image;
          session.user.isActive = token.isActive;
          session.user.role = token.role;
          session.user.profileCompleted = token.profileCompleted;
        }
        return session;
      } catch (error) {
        console.error("❌ [AUTH SESSION] Session callback error:", error);
        throw error;
      }
    },
  },
} as NextAuthOptions;
