/**
 * Rate Limiting Configuration
 * Uses Upstash Redis for distributed rate limiting
 * 
 * Environment variables required:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis instance (uses env vars automatically)
const redis = process.env.UPSTASH_REDIS_REST_URL
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    : null;

/**
 * Rate limiter for login attempts
 * Allows 5 attempts per minute per IP
 */
export const loginRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        prefix: 'ratelimit:login',
        analytics: true,
    })
    : null;

/**
 * Rate limiter for API routes
 * Allows 100 requests per minute per user
 */
export const apiRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'),
        prefix: 'ratelimit:api',
        analytics: true,
    })
    : null;

/**
 * Check rate limit for an identifier
 * Returns true if allowed, false if rate limited
 */
export async function checkRateLimit(
    limiter: Ratelimit | null,
    identifier: string
): Promise<{ success: boolean; remaining: number; reset: Date }> {
    if (!limiter) {
        // No rate limiter configured - allow all requests
        return { success: true, remaining: 999, reset: new Date() };
    }

    const result = await limiter.limit(identifier);
    return {
        success: result.success,
        remaining: result.remaining,
        reset: new Date(result.reset),
    };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    if (realIp) {
        return realIp;
    }

    return '127.0.0.1';
}
