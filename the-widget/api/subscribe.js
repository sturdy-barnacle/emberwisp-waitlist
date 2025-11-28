// Waitlist subscription API endpoint
// Handles form submissions, validates input, stores signups, and sends confirmation emails

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { supabase } from './shared/database.js';
import { 
  isValidEmail, 
  normalizeEmail, 
  generateToken, 
  getCorsHeaders,
  getClientIp 
} from './shared/utils.js';
import { getOrCreateContact } from './shared/contacts.js';
import { sendConfirmationEmail, sendWelcomeEmail } from './shared/email-service.js';
import {
  APP_CONFIG,
  CORS_CONFIG,
  FEATURES,
  RATE_LIMIT_CONFIG,
} from './shared/config.js';

// Rate limiting with Upstash Redis
// Returns null if UPSTASH env vars aren't set (disabled)
function createRateLimiter() {
  if (!RATE_LIMIT_CONFIG.upstashRedisUrl || !RATE_LIMIT_CONFIG.upstashRedisToken) {
    return null;
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_CONFIG.limit, RATE_LIMIT_CONFIG.window),
    analytics: true,
  });
}

const ratelimit = createRateLimiter();

// Verify Cloudflare Turnstile token
async function verifyTurnstile(token, ip) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: FEATURES.turnstileSecretKey,
      response: token,
      remoteip: ip,
    }),
  });
  
  const data = await response.json();
  return data.success === true;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const corsHeaders = getCorsHeaders(origin, CORS_CONFIG.allowedOrigins);

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);

  try {
    // Rate limiting check
    if (ratelimit) {
      const { success, remaining, reset } = await ratelimit.limit(ip);
      
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', reset.toString());
      
      if (!success) {
        return res.status(429).json({ 
          error: 'rate_limited',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        });
      }
    }

    const { email, source, turnstileToken } = req.body;

    // Turnstile verification (if enabled)
    if (FEATURES.turnstileEnabled) {
      if (!turnstileToken) {
        return res.status(400).json({ 
          error: 'captcha_required',
          message: 'Please complete the captcha verification.',
        });
      }
      
      const isValidCaptcha = await verifyTurnstile(turnstileToken, ip);
      if (!isValidCaptcha) {
        return res.status(400).json({ 
          error: 'captcha_failed',
          message: 'Captcha verification failed. Please try again.',
        });
      }
    }

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const normalizedEmail = normalizeEmail(email);

    // Get or create contact (unified contacts system)
    const contact = await getOrCreateContact(email);

    // Check for existing waitlist signup
    // Use contact_id if available, otherwise fall back to email lookup
    let existingQuery = supabase
      .from('waitlist')
      .select('id, confirmed, contact_id');
    
    if (contact?.contactId) {
      existingQuery = existingQuery.eq('contact_id', contact.contactId);
    } else {
      existingQuery = existingQuery.eq('email', normalizedEmail);
    }
    
    const { data: existing } = await existingQuery.single();

    if (existing) {
      if (FEATURES.doubleOptInEnabled && !existing.confirmed) {
        // Resend confirmation email
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        const updateData = { 
          confirmation_token: token,
          token_expires_at: expiresAt.toISOString(),
        };
        
        // Update contact_id if we have it and it's missing
        if (contact?.contactId && !existing.contact_id) {
          updateData.contact_id = contact.contactId;
        }
        
        await supabase
          .from('waitlist')
          .update(updateData)
          .eq('id', existing.id);
        
        await sendConfirmationEmail(normalizedEmail, token, APP_CONFIG.baseUrl);
        
        return res.status(200).json({ 
          success: true,
          message: "We've resent your confirmation email. Please check your inbox.",
          requiresConfirmation: true,
        });
      }
      
      return res.status(409).json({ 
        error: 'already_subscribed',
        message: "You're already on the waitlist!",
      });
    }

    // Generate confirmation token for double opt-in
    const confirmationToken = FEATURES.doubleOptInEnabled ? generateToken() : null;
    const tokenExpiresAt = FEATURES.doubleOptInEnabled 
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      : null;

    // Prepare insert data
    const insertData = {
      email: normalizedEmail,
      source: source || 'website',
      confirmed: !FEATURES.doubleOptInEnabled, // Auto-confirm if double opt-in is disabled
      confirmation_token: confirmationToken,
      token_expires_at: tokenExpiresAt,
    };
    
    // Add contact_id if available
    if (contact?.contactId) {
      insertData.contact_id = contact.contactId;
    }

    // Insert new signup
    const { error: insertError } = await supabase
      .from('waitlist')
      .insert(insertData);

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return res.status(500).json({ error: 'Failed to save signup' });
    }

    // Send appropriate email
    if (FEATURES.doubleOptInEnabled) {
      await sendConfirmationEmail(normalizedEmail, confirmationToken, APP_CONFIG.baseUrl);
      
      return res.status(200).json({ 
        success: true,
        message: "Almost there! Please check your inbox and confirm your email.",
        requiresConfirmation: true,
      });
    } else {
      await sendWelcomeEmail(normalizedEmail);
      
      return res.status(200).json({ 
        success: true,
        message: "You're on the list! Check your inbox for confirmation.",
      });
    }

  } catch (error) {
    console.error('Waitlist error:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
