// Unsubscribe endpoint for email compliance
// Handles both token-based and email-based unsubscribe requests

import { supabase } from './shared/database.js';
import { getCorsHeaders, normalizeEmail } from './shared/utils.js';
import { APP_CONFIG, CORS_CONFIG } from './shared/config.js';

export default async function handler(req, res) {
  // Handle CORS
  const corsHeaders = getCorsHeaders(req.headers.origin, CORS_CONFIG.allowedOrigins);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, email } = req.query;

  if (!token && !email) {
    return res.redirect(`${APP_CONFIG.baseUrl}${APP_CONFIG.unsubscribeErrorUrl}?reason=missing-params`);
  }

  try {
    let updateResult;
    const timestamp = new Date().toISOString();

    if (token) {
      // Unsubscribe via token (more secure)
      updateResult = await supabase
        .from('contacts')
        .update({ 
          email_unsubscribed: true,
          email_unsubscribed_at: timestamp,
          updated_at: timestamp
        })
        .eq('unsubscribe_token', token);
    } else if (email) {
      // Unsubscribe via email (less secure but simpler)
      const normalizedEmail = normalizeEmail(email);
      updateResult = await supabase
        .from('contacts')
        .update({ 
          email_unsubscribed: true,
          email_unsubscribed_at: timestamp,
          updated_at: timestamp
        })
        .eq('email_normalized', normalizedEmail);
    }

    if (updateResult.error) {
      console.error('Unsubscribe error:', updateResult.error);
      return res.redirect(`${APP_CONFIG.baseUrl}${APP_CONFIG.unsubscribeErrorUrl}?reason=database-error`);
    }

    // Log the unsubscribe activity to contact_activity table
    // Note: contact_activity table is created by setup.sql (Step 6)
    try {
      if (token) {
        // Get contact ID from token
        const { data: contact } = await supabase
          .from('contacts')
          .select('id')
          .eq('unsubscribe_token', token)
          .single();

        if (contact) {
          await supabase
            .from('contact_activity')
            .insert({
              contact_id: contact.id,
              activity_type: 'email_unsubscribed',
              activity_data: { 
                method: 'token',
                unsubscribed_at: timestamp,
                unsubscribed_at_epoch: Date.now()
              }
            });
        }
      } else if (email) {
        // Get contact ID from email
        const normalizedEmail = normalizeEmail(email);
        const { data: contact } = await supabase
          .from('contacts')
          .select('id')
          .eq('email_normalized', normalizedEmail)
          .single();

        if (contact) {
          await supabase
            .from('contact_activity')
            .insert({
              contact_id: contact.id,
              activity_type: 'email_unsubscribed',
              activity_data: { 
                method: 'email',
                unsubscribed_at: timestamp,
                unsubscribed_at_epoch: Date.now()
              }
            });
        }
      }
    } catch (activityError) {
      // Activity logging is optional - don't fail the unsubscribe if this fails
      // This can happen if contact_activity table doesn't exist yet
      console.log('Activity logging skipped:', activityError.message);
    }

    // Redirect to success page
    res.redirect(`${APP_CONFIG.baseUrl}${APP_CONFIG.unsubscribeSuccessUrl}`);

  } catch (error) {
    console.error('Unsubscribe handler error:', error);
    res.redirect(`${APP_CONFIG.baseUrl}${APP_CONFIG.unsubscribeErrorUrl}?reason=server-error`);
  }
}
