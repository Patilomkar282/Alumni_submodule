import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== 'production';

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
// Counts ALL API requests from an IP across every route.
// Dev: relaxed to 2000/15 min so normal testing never triggers it.
// Production: 300/15 min — enough for real users, blocks scrapers/bots.
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 2000 : 300,
    standardHeaders: true,   // Returns RateLimit-* headers (RFC 6585)
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
    skip: () => isDev && false, // set to `true` to fully disable in dev
});

// ─── Auth Rate Limiter ────────────────────────────────────────────────────────
// Counts ONLY requests to: /login, /register, /login-otp, /verify-login-otp,
// /google, /forgot-password, /verify-otp, /reset-password.
// Each IP gets its own counter — separate from the global counter above.
// Dev: 100 attempts so you can test freely.
// Production: 10 attempts / 15 min — strict brute-force protection.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 100 : 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts. Please try again in 15 minutes.' },
});
