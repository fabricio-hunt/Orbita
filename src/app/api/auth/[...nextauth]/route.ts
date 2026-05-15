import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        // Check if user exists in the database
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        // If not, create them
        if (existingUser.length === 0) {
          await db.insert(users).values({
            email: user.email,
            name: user.name || null,
            image: user.image || null,
          });
        }
        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      // When the user signs in, we fetch their DB ID to attach to the token
      if (user && user.email) {
        try {
          const dbUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          if (dbUser.length > 0) {
            token.id = dbUser[0].id;
          }
        } catch (error) {
          console.error("Error during JWT callback:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Pass the DB user ID to the session object
      if (session.user && token.id) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
