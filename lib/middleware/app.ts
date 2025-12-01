import { NextRequest, NextResponse } from "next/server";

import { getToken } from "next-auth/jwt";

export default async function AppMiddleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;
  const isInvited = url.searchParams.has("invitation");
  const token = (await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })) as {
    email?: string;
    user?: {
      createdAt?: string;
    };
  };

  // AUTHENTICATED if the path is "/", redirect to "/dashboard"
  if (token?.email && path === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // UNAUTHENTICATED if there's no token and the path is "/", allow access to homepage
  if (!token?.email && path === "/") {
    return NextResponse.next();
  }

  // UNAUTHENTICATED if there's no token and the path isn't /login, /register, or /sponsorship, redirect to /login
  if (
    !token?.email &&
    path !== "/login" &&
    path !== "/register" &&
    path !== "/sponsorship"
  ) {
    const loginUrl = new URL(`/login`, req.url);
    const nextPath =
      path === "/auth/confirm-email-change" ? `${path}${url.search}` : path;

    loginUrl.searchParams.set("next", encodeURIComponent(nextPath));
    return NextResponse.redirect(loginUrl);
  }

  // AUTHENTICATED if the path is /login, /register, or /sponsorship, redirect to "/dashboard"
  if (
    token?.email &&
    (path === "/login" || path === "/register" || path === "/sponsorship")
  ) {
    const nextPath = url.searchParams.get("next") || "/dashboard"; // Default redirection to "/dashboard" if no next parameter
    return NextResponse.redirect(
      new URL(decodeURIComponent(nextPath), req.url),
    );
  }
}
