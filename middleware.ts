import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isPublicPath = path === "/login" || path === "/signup" || path === "/";
  const isOnboardingPath = path === "/onboarding";
  const token = await getToken({ req: request });

  // If user is logged in and tries to access auth pages
  if (isPublicPath && token) {
    // Check if profile is completed from token (we'll add this to the token)
    const profileCompleted = token.profileCompleted as boolean;
    const isAdmin = token.role === "General Admin" || token.role === "Community Admin";

    // Admins bypass onboarding
    if (isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (!profileCompleted) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user is not logged in and tries to access protected routes, redirect to login
  if (
    !isPublicPath &&
    !token &&
    !path.startsWith("/api/auth") &&
    !isOnboardingPath
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check if user has completed profile (only for logged in users accessing protected routes)
  if (token && !isPublicPath && !isOnboardingPath && !path.startsWith("/api")) {
    const profileCompleted = token.profileCompleted as boolean;
    const isAdmin = token.role === "General Admin" || token.role === "Community Admin";

    // Admins bypass profile completion check
    if (!isAdmin && !profileCompleted) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/dashboard/:path*",
    "/admin/:path*",
    "/onboarding",
  ],
};
