'use server';

import { signIn as nextAuthSignIn } from 'next-auth/react';
import { checkRateLimit, loginRateLimiter, getClientIP } from '@/lib/ratelimit';
import { headers } from 'next/headers';

export type LoginResult = {
    success: boolean;
    error?: string;
    rateLimited?: boolean;
    retryAfter?: number;
};

/**
 * Server action for login with rate limiting
 * Wraps NextAuth signIn with IP-based rate limiting
 */
export async function loginWithRateLimit(
    email: string,
    password: string
): Promise<LoginResult> {
    try {
        // Get client IP for rate limiting
        const headersList = await headers();
        const forwarded = headersList.get('x-forwarded-for');
        const realIp = headersList.get('x-real-ip');
        const clientIP = forwarded?.split(',')[0]?.trim() || realIp || '127.0.0.1';

        // Check rate limit
        const rateLimitResult = await checkRateLimit(loginRateLimiter, clientIP);

        if (!rateLimitResult.success) {
            const retryAfter = Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000);
            return {
                success: false,
                error: `Demasiados intentos. Espera ${retryAfter} segundos.`,
                rateLimited: true,
                retryAfter,
            };
        }

        // The actual signIn happens client-side via NextAuth
        // This action just validates rate limiting
        // Return remaining attempts for user feedback
        return {
            success: true,
            error: undefined,
            rateLimited: false,
        };
    } catch (error) {
        console.error('Login rate limit check error:', error);
        // On error, allow the attempt but log it
        return {
            success: true,
            error: undefined,
        };
    }
}
