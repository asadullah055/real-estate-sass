import nodemailer from "nodemailer";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: Number(env.SMTP_PORT) === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html });
    logger.info(`Email sent to ${to} — "${subject}"`);
  } catch (err) {
    logger.error(`Failed to send email to ${to}`, err);
    throw err;
  }
}

/** Branded verification email template */
export function buildVerificationEmail(verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#00D4FF 0%,#6644EE 50%,#CC00FF 100%);padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">NebulaNexus</h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px;">
                <h2 style="margin:0 0 12px;color:#111827;font-size:20px;font-weight:600;">Verify your email address</h2>
                <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                  Thanks for signing up! Click the button below to verify your email and activate your account.
                  This link expires in <strong>24 hours</strong>.
                </p>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:8px;background:linear-gradient(135deg,#6644EE,#CC00FF);">
                      <a href="${verificationUrl}"
                         style="display:inline-block;padding:13px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                        Verify Email Address
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;line-height:1.5;">
                  If you didn't create a NebulaNexus account, you can safely ignore this email.<br/>
                  Or copy this link: <a href="${verificationUrl}" style="color:#6644EE;word-break:break-all;">${verificationUrl}</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
                <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; ${new Date().getFullYear()} NebulaNexus. All rights reserved.</p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}
