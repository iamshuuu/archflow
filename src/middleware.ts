import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const { pathname } = req.nextUrl;

    // Protect all dashboard routes
    if (pathname.startsWith("/dashboard")) {
        if (!req.auth) {
            const loginUrl = new URL("/login", req.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Redirect authenticated users away from login/signup
    if (pathname === "/login" || pathname === "/signup") {
        if (req.auth) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/dashboard/:path*", "/login", "/signup"],
};
