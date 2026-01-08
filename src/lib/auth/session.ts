/**
 * Session Management Utilities
 * Implements single session per user enforcement (H-005)
 */

import { eq, lt, and } from 'drizzle-orm';
import { db, userSessions, users } from '@/lib/db';

// Use Web Crypto API for Edge Runtime compatibility
function generateSessionToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface SessionInfo {
    sessionToken: string;
    expiresAt: Date;
    userId: string;
}

/**
 * Create a new session for a user, invalidating all previous sessions
 * This enforces the single session per user rule (RN-012)
 */
export async function createUserSession(
    userId: string,
    userAgent?: string,
    ipAddress?: string
): Promise<SessionInfo> {
    // First, invalidate all existing sessions for this user
    await db.delete(userSessions).where(eq(userSessions.userId, userId));

    // Create new session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await db.insert(userSessions).values({
        userId,
        sessionToken,
        expiresAt,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
    });

    return {
        sessionToken,
        expiresAt,
        userId,
    };
}

/**
 * Validate a session token and return the user if valid
 */
export async function validateSession(sessionToken: string): Promise<{
    valid: boolean;
    userId?: string;
    session?: typeof userSessions.$inferSelect;
}> {
    const session = await db.query.userSessions.findFirst({
        where: and(
            eq(userSessions.sessionToken, sessionToken),
            // Session must not be expired
        ),
        with: {
            user: true,
        },
    });

    if (!session) {
        return { valid: false };
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
        // Clean up expired session
        await db.delete(userSessions).where(eq(userSessions.id, session.id));
        return { valid: false };
    }

    // Update last active timestamp
    await db.update(userSessions)
        .set({ lastActiveAt: new Date() })
        .where(eq(userSessions.id, session.id));

    return {
        valid: true,
        userId: session.userId,
        session,
    };
}

/**
 * Invalidate a specific session
 */
export async function invalidateSession(sessionToken: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.sessionToken, sessionToken));
}

/**
 * Invalidate all sessions for a user (e.g., on password change)
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.userId, userId));
}

/**
 * Clean up all expired sessions (can be run as a cron job)
 */
export async function cleanupExpiredSessions(): Promise<number> {
    const result = await db.delete(userSessions)
        .where(lt(userSessions.expiresAt, new Date()));

    return 0; // Drizzle doesn't return count easily, would need raw query
}

/**
 * Get all active sessions for a user (for admin purposes)
 */
export async function getUserSessions(userId: string) {
    return await db.query.userSessions.findMany({
        where: eq(userSessions.userId, userId),
        orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
    });
}
