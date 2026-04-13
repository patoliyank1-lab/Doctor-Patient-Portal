import nodemailer from "nodemailer";
import { lodVariable } from "./dotenv";

const fromEmail = () => lodVariable("GMAIL_USER");
const appPassword = () => lodVariable("GMAIL_APP_PASSWORD");

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: fromEmail(),
      pass: appPassword(),
    },
  });
  return transporter;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export const sendEmail = async ({ to, subject, html }: SendEmailInput) => {
  const tx = getTransporter();
  await tx.sendMail({
    from: fromEmail(),
    to,
    subject,
    html,
  });
};

export const buildVerifyEmailTemplate = (params: { verifyUrl: string }) => {
  return {
    subject: "Verify your email",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2 style="margin: 0 0 12px;">Verify your email</h2>
        <p style="margin: 0 0 12px;">
          Please confirm your email address by clicking the button below.
        </p>
        <p style="margin: 16px 0;">
          <a
            href="${params.verifyUrl}"
            style="display:inline-block;padding:10px 14px;background:#111827;color:#fff;text-decoration:none;border-radius:6px;"
          >
            Verify email
          </a>
        </p>
        <p style="margin: 0 0 8px;color:#6b7280;font-size: 13px;">
          If you didn’t create an account, you can ignore this email.
        </p>
      </div>
    `,
  };
};

export const buildForgotPasswordTemplate = (params: { resetUrl: string }) => {
  return {
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2 style="margin: 0 0 12px;">Reset your password</h2>
        <p style="margin: 0 0 12px;">
          We received a request to reset your password. Click below to continue.
        </p>
        <p style="margin: 16px 0;">
          <a
            href="${params.resetUrl}"
            style="display:inline-block;padding:10px 14px;background:#111827;color:#fff;text-decoration:none;border-radius:6px;"
          >
            Reset password
          </a>
        </p>
        <p style="margin: 0 0 8px;color:#6b7280;font-size: 13px;">
          If you didn’t request this, you can ignore this email.
        </p>
      </div>
    `,
  };
};

