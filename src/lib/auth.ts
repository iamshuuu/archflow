import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compareSync } from "bcryptjs";
import { db } from "@/lib/db";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

type CredentialsInput = {
    email?: string;
    password?: string;
};

export const { handlers, signIn, signOut, auth } = NextAuth({
    session: { strategy: "jwt" },
    pages: { signIn: "/login" },
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const typed = credentials as CredentialsInput | undefined;
                if (!typed?.email || !typed?.password) return null;
                const user = await db.user.findUnique({
                    where: { email: typed.email },
                });
                if (!user) return null;

                const valid = compareSync(typed.password, user.passwordHash);
                if (!valid) return null;

                return { id: user.id, name: user.name, email: user.email, role: user.role };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }: { token: JWT & { role?: string; id?: string }; user?: { role?: string; id?: string } | null }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }: { session: Session & { user?: { name?: string | null; email?: string | null; image?: string | null; role?: string; id?: string } }; token: JWT & { role?: string; id?: string } }) {
            if (session.user) {
                session.user = {
                    ...session.user,
                    role: token.role,
                    id: token.id,
                };
            }
            return session;
        },
    },
});
