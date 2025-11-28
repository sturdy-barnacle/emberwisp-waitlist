// Email service abstraction
// ⚠️ RESEND REQUIRED: This implementation uses Resend for sending emails.
// If you want to use a different email service (SendGrid, Mailgun, AWS SES, etc.),
// modify the sendEmail() function below to use your chosen service's API.

import { Resend } from 'resend';
import { EMAIL_CONFIG } from './config.js';
import {
  getConfirmationEmailHtml,
  getConfirmationEmailText,
  getWelcomeEmailHtml,
  getWelcomeEmailText,
} from './email-templates.js';
import { emailConfig } from '../../templates/config.js';

// Initialize Resend client
// If using a different email service, replace this initialization
const resend = new Resend(EMAIL_CONFIG.resendApiKey);

/**
 * Send confirmation email for double opt-in
 * @param {string} email - Recipient email address
 * @param {string} token - Confirmation token
 * @param {string} baseUrl - Base URL for confirmation link
 * @returns {Promise<void>}
 */
export async function sendConfirmationEmail(email, token, baseUrl) {
  const confirmUrl = `${baseUrl}/api/confirm?token=${token}`;
  
  // ⚠️ RESEND-SPECIFIC: Replace this with your email service if not using Resend
  const { error } = await resend.emails.send({
    from: EMAIL_CONFIG.fromEmail,
    to: email,
    subject: emailConfig.confirmationSubject,
    html: getConfirmationEmailHtml(confirmUrl),
    text: getConfirmationEmailText(confirmUrl),
  });

  if (error) {
    console.error('Resend confirmation email error:', error);
    // Don't throw - email failures shouldn't break the signup flow
  }
}

/**
 * Send welcome email after confirmation
 * @param {string} email - Recipient email address
 * @param {string} unsubscribeToken - Token for unsubscribe link (optional)
 * @returns {Promise<void>}
 */
export async function sendWelcomeEmail(email, unsubscribeToken = null) {
  // ⚠️ RESEND-SPECIFIC: Replace this with your email service if not using Resend
  const { error } = await resend.emails.send({
    from: EMAIL_CONFIG.fromEmail,
    to: email,
    subject: emailConfig.welcomeSubject,
    html: getWelcomeEmailHtml(unsubscribeToken, email),
    text: getWelcomeEmailText(unsubscribeToken, email),
  });

  if (error) {
    console.error('Resend welcome email error:', error);
    // Don't throw - email failures shouldn't break the confirmation flow
  }
}

