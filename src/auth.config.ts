import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no Prisma/bcrypt) shared by middleware and the full auth setup.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "CUSTOMER" | "ADMIN";
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/admin")) {
        if (!auth?.user) return false;
        if (auth.user.role !== "ADMIN") return Response.redirect(new URL("/", request.nextUrl));
        return true;
      }
      if (pathname.startsWith("/account")) return !!auth?.user;
      return true;
    },
  },
} satisfies NextAuthConfig;
