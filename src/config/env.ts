import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("5000"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:5000"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
  STRIPE_PRO_PRICE_ID: z.string().min(1, "STRIPE_PRO_PRICE_ID is required"),

  // SMTP (Nodemailer)
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z.string().default("587"),
  SMTP_USER: z.string().min(1, "SMTP_USER is required"),
  SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),
  SMTP_FROM: z.string().default("NebulaNexus <no-reply@nebulanexus.io>"),

  // Retell AI
  RETELL_API_KEY: z.string().default(""),
  RETELL_WEBHOOK_SECRET: z.string().default(""),
  DEFAULT_WORKSPACE_ID: z.string().default(""),

  // n8n
  N8N_BASE_URL: z.string().default(""),
  N8N_API_KEY: z.string().default(""),
  N8N_WEBHOOK_NEW_LEAD: z.string().default(""),
  N8N_WEBHOOK_LEAD_QUALIFIED: z.string().default(""),
  N8N_WEBHOOK_MEETING_BOOKED: z.string().default(""),
  N8N_WEBHOOK_LEAD_UPDATED: z.string().default(""),

  // Cloudinary
  CLOUDINARY_URL: z.string().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
