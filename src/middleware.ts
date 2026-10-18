import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// First line of defence. Admin pages and actions also call requireAdmin().
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
