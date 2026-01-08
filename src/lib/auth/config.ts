import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db, users, userCompanies } from '@/lib/db';
import { invalidateAllUserSessions, createUserSession } from './session';

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                // Find user by email
                const user = await db.query.users.findFirst({
                    where: eq(users.email, email),
                });

                if (!user || !user.isActive) {
                    return null;
                }

                // Verify password
                const isValid = await bcrypt.compare(password, user.passwordHash);
                if (!isValid) {
                    return null;
                }

                // Invalidate all previous sessions for this user (H-005: single session enforcement)
                await invalidateAllUserSessions(user.id);

                // Create new session record
                await createUserSession(user.id);

                // Get user companies
                const userCompaniesList = await db.query.userCompanies.findMany({
                    where: eq(userCompanies.userId, user.id),
                });
                const companyIds = userCompaniesList.map(uc => uc.companyId);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    areaId: user.areaId,
                    companyIds,
                };
            },
        }),
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.areaId = user.areaId;
                token.companyIds = user.companyIds;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.areaId = token.areaId as string | null;
                session.user.companyIds = token.companyIds as string[];
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 hours
    },
});
