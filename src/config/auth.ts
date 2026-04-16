import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { oneTap } from "better-auth/plugins";
import { getNativeDb } from "../infra/database/connection.js";
import { buildVerificationEmail, sendEmail } from "../infra/email/mailer.js";
import { env } from "./env.js";

/**
 * Call once after connectDB() resolves.
 * Better Auth manages its own collections: user, session, account, verification.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _auth: any = null;

/** Returns the initialised Better Auth instance (throws if not yet initialised). */
export function getAuth(): Auth {
  if (!_auth) throw new Error("Auth not initialised. Call initAuth() first.");
  return _auth as Auth;
}

export function initAuth() {
  const auth = betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.FRONTEND_URL],

    database: mongodbAdapter(getNativeDb()),

    // ── Email + Password ──────────────────────────────────────────────────
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true, // block login until email is verified
    },

    // ── Email Verification ────────────────────────────────────────────────
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "Verify your NebulaNexus account",
          html: buildVerificationEmail(url),
        });
      },
      // After clicking the link, redirect to dashboard
      callbackURL: `${env.FRONTEND_URL}/dashboard`,
      // Token expires in 24 hours
      expiresIn: 60 * 60 * 24,
    },

    // ── Social Providers ──────────────────────────────────────────────────
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },

    plugins: [
      oneTap(), // handles Google One Tap credential (JWT) verification
    ],

    session: {
      expiresIn: 60 * 60 * 24 * 7,  // 7 days
      updateAge: 60 * 60 * 24,       // rotate session token daily
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // cache session in cookie for 5 min to reduce DB reads
      },
    },

    advanced: {
      ipAddress: {
        ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'],
        disableIpTracking: false,
      },
    },
  });

  _auth = auth;
  return auth;
}

export type Auth = ReturnType<typeof initAuth>;
