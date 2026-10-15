// emailService — the ONLY file that imports Nodemailer, same pattern as
// storageService/aiProvider/paymentProvider. If SMTP isn't configured, we
// don't pretend the email sent: we log the content (including the actual
// reset link) to the server console so the flow is still testable locally,
// and callers get an honest signal about what happened.
const env = require("../../config/env");

let transporter = null;

function isConfigured() {
  return !!(env.smtp.host && env.smtp.user && env.smtp.pass);
}

function getTransporter() {
  if (!transporter) {
    const nodemailer = require("nodemailer");
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  const subject = "Reset your StudyNest AI password";
  const text = `We received a request to reset your password. Click the link below (valid for 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`;

  if (!isConfigured()) {
    console.log("\n[emailService] SMTP not configured — printing the reset email instead of sending it:");
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Reset link: ${resetUrl}\n`);
    return { sent: false, reason: "SMTP_NOT_CONFIGURED" };
  }

  await getTransporter().sendMail({ from: env.smtp.from, to, subject, text });
  return { sent: true };
}

async function sendVerificationEmail({ to, verifyUrl }) {
  const subject = "Verify your StudyNest AI email";
  const text = `Welcome to StudyNest AI! Confirm your email address by clicking the link below (valid for 24 hours):\n\n${verifyUrl}\n\nIf you didn't create this account, you can safely ignore this email.`;

  if (!isConfigured()) {
    console.log("\n[emailService] SMTP not configured — printing the verification email instead of sending it:");
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Verify link: ${verifyUrl}\n`);
    return { sent: false, reason: "SMTP_NOT_CONFIGURED" };
  }

  await getTransporter().sendMail({ from: env.smtp.from, to, subject, text });
  return { sent: true };
}

module.exports = { sendPasswordResetEmail, sendVerificationEmail, isConfigured };
