import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { isAllowedEmail } from "@/lib/admin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "database" },
  providers: [
    Resend({
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user }) {
      return isAllowedEmail(user.email);
    },
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.email = user.email;
      session.user.name = user.name;
      return session;
    },
  },
});
