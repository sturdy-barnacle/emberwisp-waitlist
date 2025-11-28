// Email confirmation API endpoint
// Handles confirmation link clicks, validates tokens, and sends welcome emails

import { supabase } from './shared/database.js';
import {
  updateContactVerified, 
  updateContactVerifiedByEmail 
} from './shared/contacts.js';
import { sendWelcomeEmail } from './shared/email-service.js';
import { APP_CONFIG } from './shared/config.js';
import { normalizeEmail } from './shared/utils.js';

export default async function handler(req, res) {
  // Only allow GET (clicking link from email)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.redirect(302, `${APP_CONFIG.confirmErrorUrl}?error=missing_token`);
  }

  try {
    // Find the signup with this token
    const { data: signup, error: findError } = await supabase
      .from('waitlist')
      .select('id, email, confirmed, token_expires_at')
      .eq('confirmation_token', token)
      .single();

    if (findError || !signup) {
      return res.redirect(302, `${APP_CONFIG.confirmErrorUrl}?error=invalid_token`);
    }

    // Check if already confirmed
    if (signup.confirmed) {
      return res.redirect(302, `${APP_CONFIG.confirmSuccessUrl}?status=already_confirmed`);
    }

    // Check if token expired
    if (signup.token_expires_at && new Date(signup.token_expires_at) < new Date()) {
      return res.redirect(302, `${APP_CONFIG.confirmErrorUrl}?error=expired_token`);
    }

    // Confirm the signup
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('waitlist')
      .update({
        confirmed: true,
        confirmed_at: now,
        confirmation_token: null, // Clear the token
        token_expires_at: null,
      })
      .eq('id', signup.id);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return res.redirect(302, `${APP_CONFIG.confirmErrorUrl}?error=update_failed`);
    }

    // Update contact email_verified status and get unsubscribe token if contacts table exists
    let unsubscribeToken = null;
    try {
      // Try to get contact_id from waitlist entry
      const { data: waitlistEntry } = await supabase
        .from('waitlist')
        .select('contact_id')
        .eq('id', signup.id)
        .single();
      
      if (waitlistEntry?.contact_id) {
        // Update contact to mark email as verified
        await updateContactVerified(waitlistEntry.contact_id, now);
        
        // Get unsubscribe token for welcome email
        const { data: contact } = await supabase
          .from('contacts')
          .select('unsubscribe_token')
          .eq('id', waitlistEntry.contact_id)
          .single();
        
        unsubscribeToken = contact?.unsubscribe_token;
      } else {
        // Fallback: try to find contact by email and get token
        await updateContactVerifiedByEmail(signup.email, now);
        
        const { data: contact } = await supabase
          .from('contacts')
          .select('unsubscribe_token')
          .eq('email_normalized', normalizeEmail(signup.email))
          .single();
        
        unsubscribeToken = contact?.unsubscribe_token;
      }
    } catch (contactError) {
      // Contacts table might not exist - that's okay, continue
      console.log('Contact update skipped (contacts table may not exist)');
    }

    // Send welcome email now that they're confirmed (with unsubscribe token if available)
    await sendWelcomeEmail(signup.email, unsubscribeToken);

    // Redirect to success page
    return res.redirect(302, APP_CONFIG.confirmSuccessUrl);

  } catch (error) {
    console.error('Confirmation error:', error);
    return res.redirect(302, `${APP_CONFIG.confirmErrorUrl}?error=server_error`);
  }
}
