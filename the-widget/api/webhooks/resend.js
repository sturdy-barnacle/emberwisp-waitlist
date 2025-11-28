// Resend webhook handler for two-way sync
// Receives events from Resend (bounces, complaints, unsubscribes) and updates Supabase

import { supabase } from '../shared/database.js';
import { RESEND_CONTACTS_CONFIG } from '../shared/config.js';
import { normalizeEmail } from '../shared/utils.js';
import crypto from 'crypto';

/**
 * Verify Resend webhook signature (if secret is configured)
 * @param {string} payload - Raw request body as string
 * @param {string} signature - Signature from resend-signature header
 * @param {string} secret - Webhook signing secret
 * @returns {boolean}
 */
function verifyWebhookSignature(payload, signature, secret) {
  if (!secret || !signature) {
    return !secret; // If no secret configured, allow unsigned requests
  }
  
  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload, 'utf8');
    const expectedSignature = hmac.digest('hex');
    
    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return false;
  }
}

/**
 * Log activity to contact_activity table
 * @param {string} normalizedEmail - Normalized email address
 * @param {string} activityType - Type of activity
 * @param {Object} activityData - Additional activity data
 */
async function logActivity(normalizedEmail, activityType, activityData) {
  try {
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
          activity_type: activityType,
          activity_data: {
            ...activityData,
            source: 'resend_webhook',
            received_at: new Date().toISOString(),
            received_at_epoch: Date.now()
          }
        });
    }
  } catch (err) {
    // Activity logging is optional - don't fail the webhook
    console.log('Activity logging skipped:', err.message);
  }
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook signature if secret is configured
  if (RESEND_CONTACTS_CONFIG.webhookSecret) {
    const signature = req.headers['svix-signature'] || req.headers['resend-signature'];
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    
    if (!verifyWebhookSignature(rawBody, signature, RESEND_CONTACTS_CONFIG.webhookSecret)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  const { type, data } = req.body;
  
  // Extract email from various event formats
  // Resend events can have email in different places depending on event type
  const email = data?.to?.[0] || data?.email || data?.contact?.email;
  
  if (!email) {
    console.log('Webhook received but no email found:', type);
    return res.status(200).json({ received: true, skipped: 'no_email' });
  }

  const normalizedEmail = normalizeEmail(email);
  const timestamp = new Date().toISOString();

  console.log(`Resend webhook received: ${type} for ${email}`);

  try {
    switch (type) {
      // Email bounced - mark contact as bounced
      case 'email.bounced': {
        const { error } = await supabase
          .from('contacts')
          .update({
            email_bounced: true,
            email_bounced_at: timestamp,
            updated_at: timestamp
          })
          .eq('email_normalized', normalizedEmail);
        
        if (error) {
          console.error('Failed to update bounced status:', error);
        } else {
          console.log(`Marked as bounced: ${email}`);
        }
        
        await logActivity(normalizedEmail, 'email_bounced', {
          bounce_type: data?.bounce?.type || 'unknown',
          reason: data?.bounce?.message || data?.reason || ''
        });
        break;
      }

      // Spam complaint - treat as unsubscribe
      case 'email.complained': {
        const { error } = await supabase
          .from('contacts')
          .update({
            email_unsubscribed: true,
            email_unsubscribed_at: timestamp,
            updated_at: timestamp
          })
          .eq('email_normalized', normalizedEmail);
        
        if (error) {
          console.error('Failed to update complained status:', error);
        } else {
          console.log(`Marked as unsubscribed (complaint): ${email}`);
        }
        
        await logActivity(normalizedEmail, 'email_complained', {
          complaint_type: 'spam'
        });
        break;
      }

      // Contact unsubscribed via Resend
      case 'contact.unsubscribed': {
        const { error } = await supabase
          .from('contacts')
          .update({
            email_unsubscribed: true,
            email_unsubscribed_at: timestamp,
            updated_at: timestamp
          })
          .eq('email_normalized', normalizedEmail);
        
        if (error) {
          console.error('Failed to update unsubscribed status:', error);
        } else {
          console.log(`Marked as unsubscribed: ${email}`);
        }
        
        await logActivity(normalizedEmail, 'email_unsubscribed', {
          method: 'resend_unsubscribe_link'
        });
        break;
      }

      // Contact created in Resend (informational)
      case 'contact.created': {
        console.log(`Contact created in Resend: ${email}`);
        await logActivity(normalizedEmail, 'resend_contact_created', {});
        break;
      }

      // Contact updated in Resend
      case 'contact.updated': {
        // Check if unsubscribed status changed
        if (data?.contact?.unsubscribed === true) {
          const { error } = await supabase
            .from('contacts')
            .update({
              email_unsubscribed: true,
              email_unsubscribed_at: timestamp,
              updated_at: timestamp
            })
            .eq('email_normalized', normalizedEmail);
          
          if (!error) {
            console.log(`Synced unsubscribe from Resend: ${email}`);
          }
        }
        await logActivity(normalizedEmail, 'resend_contact_updated', {
          unsubscribed: data?.contact?.unsubscribed
        });
        break;
      }

      // Contact deleted from Resend
      case 'contact.deleted': {
        console.log(`Contact deleted from Resend: ${email}`);
        await logActivity(normalizedEmail, 'resend_contact_deleted', {});
        break;
      }

      // Email delivery events (for analytics, optional logging)
      case 'email.sent':
      case 'email.delivered':
      case 'email.opened':
      case 'email.clicked': {
        // These are informational - just log them
        console.log(`Email event: ${type} for ${email}`);
        await logActivity(normalizedEmail, type.replace('email.', 'email_'), {
          email_id: data?.email_id,
          subject: data?.subject
        });
        break;
      }

      // Delivery failed (soft bounce or other issue)
      case 'email.delivery_delayed': {
        console.log(`Email delivery delayed: ${email}`);
        await logActivity(normalizedEmail, 'email_delivery_delayed', {
          reason: data?.reason
        });
        break;
      }

      default:
        console.log(`Unknown webhook event type: ${type}`);
    }

    return res.status(200).json({ received: true, type, email });

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 to prevent Resend from retrying (we logged the error)
    return res.status(200).json({ received: true, error: 'processing_failed' });
  }
}

