// Centralized configuration for the waitlist API
// All environment variables and configuration values are defined here

// Email service configuration
// ⚠️ RESEND REQUIRED: The email service abstraction uses Resend.
// If you want to use a different email service, modify api/shared/email-service.js
export const EMAIL_CONFIG = {
  fromEmail: process.env.FROM_EMAIL || 'Your Project <hello@yourdomain.com>',
  resendApiKey: process.env.RESEND_API_KEY,
};

// Database configuration
export const DATABASE_CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
};

// Application configuration
export const APP_CONFIG = {
  baseUrl: process.env.BASE_URL || 'https://yourdomain.com',
  confirmSuccessUrl: process.env.CONFIRM_SUCCESS_URL || '/waitlist-confirmed',
  confirmErrorUrl: process.env.CONFIRM_ERROR_URL || '/waitlist-error',
  unsubscribeSuccessUrl: process.env.UNSUBSCRIBE_SUCCESS_URL || '/unsubscribe-success',
  unsubscribeErrorUrl: process.env.UNSUBSCRIBE_ERROR_URL || '/unsubscribe-error',
};

// CORS configuration
// Add your domains here - these are the allowed origins for API requests
export const CORS_CONFIG = {
  allowedOrigins: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'http://localhost:3000',  // Vercel dev server
    'http://localhost:4000',  // Jekyll local dev
    // Add more domains as needed
  ],
};

// Feature flags
export const FEATURES = {
  turnstileEnabled: !!process.env.TURNSTILE_SECRET_KEY,
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
  doubleOptInEnabled: process.env.DOUBLE_OPTIN !== 'false', // Enabled by default
  rateLimitingEnabled: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  upstashRedisUrl: process.env.UPSTASH_REDIS_REST_URL,
  upstashRedisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  // Rate limit: 5 signups per IP per hour
  limit: 5,
  window: '1 h',
};

// Email template configuration
// Choose which email template style to use
export const TEMPLATE_CONFIG = {
  // Available options: 'minimal' (default), 'professional', 'branded'
  // Note: 'default' is an alias for 'minimal' (backward compatibility)
  emailStyle: process.env.EMAIL_TEMPLATE_STYLE || 'minimal',
  
  // Template file mappings
  templates: {
    // 'default' is an alias for 'minimal' (backward compatibility)
    default: {
      confirmation: 'confirmation-email.html',
      confirmationText: 'confirmation-email.txt',
      welcome: 'welcome-email.html',
      welcomeText: 'welcome-email.txt',
    },
    minimal: {
      confirmation: 'confirmation-email.html',
      confirmationText: 'confirmation-email.txt',
      welcome: 'welcome-email.html',
      welcomeText: 'welcome-email.txt',
    },
    professional: {
      confirmation: 'examples/confirmation-email-professional.html',
      confirmationText: 'confirmation-email.txt', // Reuse default text version
      welcome: 'examples/welcome-email-professional.html',
      welcomeText: 'welcome-email.txt', // Reuse default text version
    },
    branded: {
      confirmation: 'examples/confirmation-email-branded.html',
      confirmationText: 'confirmation-email.txt', // Reuse default text version
      welcome: 'examples/welcome-email-branded.html',
      welcomeText: 'welcome-email.txt', // Reuse default text version
    },
  },
};

