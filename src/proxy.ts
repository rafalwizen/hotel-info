import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Next.js 16 renamed middleware -> proxy. Optimistic session gate for the
 * admin panel: real authorization always happens again inside Server
 * Functions via requireHotel().
 */
export default auth((req) => {
  if (!req.auth) {
    const url = new URL("/zaloguj", req.nextUrl.origin);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/panel/:path*"],
};
