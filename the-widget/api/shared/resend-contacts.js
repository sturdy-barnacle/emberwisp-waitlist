// Resend Contacts API integration for syncing subscribers
// Handles adding confirmed users to Resend Audience and updating subscription status

import { Resend } from 'resend';
import { EMAIL_CONFIG, RESEND_CONTACTS_CONFIG } from './config.js';

// Initialize Resend client (reuse from email-service)
const resend = new Resend(EMAIL_CONFIG.resendApiKey);

/**
 * Add or update a contact in Resend Audience
 * Called when a user confirms their waitlist signup
 * @param {Object} contact - Contact data
 * @param {string} contact.email - Email address
 * @param {boolean} contact.unsubscribed - Whether contact is unsubscribed
 * @param {Object} contact.metadata - Optional metadata (first_name, last_name, etc.)
 * @returns {Promise<Object|null>} - Resend contact data or null if sync disabled/failed
 */
export async function syncContactToResend(contact) {
  if (!RESEND_CONTACTS_CONFIG.audienceId) {
    console.log('RESEND_AUDIENCE_ID not configured, skipping Resend Contacts sync');
    return null;
  }

  try {
    const { data, error } = await resend.contacts.create({
      audienceId: RESEND_CONTACTS_CONFIG.audienceId,
      email: contact.email,
      firstName: contact.metadata?.first_name || '',
      lastName: contact.metadata?.last_name || '',
      unsubscribed: contact.unsubscribed || false,
    });

    if (error) {
      // If contact already exists, try to update instead
      if (error.message?.includes('already exists')) {
        return await updateResendContact(contact.email, {
          unsubscribed: contact.unsubscribed || false,
          firstName: contact.metadata?.first_name,
          lastName: contact.metadata?.last_name,
        });
      }
      console.error('Resend contact create error:', error);
      return null;
    }

    console.log(`Synced contact to Resend: ${contact.email}`);
    return data;
  } catch (err) {
    console.error('Resend contact sync failed:', err);
    return null;
  }
}

/**
 * Update an existing contact in Resend Audience
 * @param {string} email - Email address to update
 * @param {Object} updates - Fields to update
 * @param {boolean} updates.unsubscribed - Subscription status
 * @param {string} updates.firstName - First name (optional)
 * @param {string} updates.lastName - Last name (optional)
 * @returns {Promise<Object|null>} - Updated contact data or null
 */
export async function updateResendContact(email, updates) {
  if (!RESEND_CONTACTS_CONFIG.audienceId) {
    console.log('RESEND_AUDIENCE_ID not configured, skipping Resend Contacts update');
    return null;
  }

  try {
    // First get the contact ID by email
    const { data: contact, error: getError } = await resend.contacts.get({
      audienceId: RESEND_CONTACTS_CONFIG.audienceId,
      email,
    });

    if (getError || !contact) {
      console.log(`Contact not found in Resend: ${email}`);
      return null;
    }

    // Update the contact
    const { data, error } = await resend.contacts.update({
      audienceId: RESEND_CONTACTS_CONFIG.audienceId,
      id: contact.id,
      unsubscribed: updates.unsubscribed,
      firstName: updates.firstName || contact.first_name,
      lastName: updates.lastName || contact.last_name,
    });

    if (error) {
      console.error('Resend contact update error:', error);
      return null;
    }

    console.log(`Updated Resend contact: ${email} (unsubscribed: ${updates.unsubscribed})`);
    return data;
  } catch (err) {
    console.error('Resend contact update failed:', err);
    return null;
  }
}

/**
 * Mark a contact as unsubscribed in Resend
 * Called when user unsubscribes via your app
 * @param {string} email - Email address to unsubscribe
 * @returns {Promise<Object|null>} - Updated contact data or null
 */
export async function unsubscribeResendContact(email) {
  return await updateResendContact(email, { unsubscribed: true });
}

/**
 * Remove a contact from Resend Audience entirely
 * Use sparingly - typically you want to unsubscribe rather than delete
 * @param {string} email - Email address to remove
 * @returns {Promise<boolean>} - True if removed successfully
 */
export async function removeResendContact(email) {
  if (!RESEND_CONTACTS_CONFIG.audienceId) {
    return false;
  }

  try {
    // First get the contact ID
    const { data: contact, error: getError } = await resend.contacts.get({
      audienceId: RESEND_CONTACTS_CONFIG.audienceId,
      email,
    });

    if (getError || !contact) {
      return false;
    }

    const { error } = await resend.contacts.remove({
      audienceId: RESEND_CONTACTS_CONFIG.audienceId,
      id: contact.id,
    });

    if (error) {
      console.error('Resend contact remove error:', error);
      return false;
    }

    console.log(`Removed contact from Resend: ${email}`);
    return true;
  } catch (err) {
    console.error('Resend contact remove failed:', err);
    return false;
  }
}

/**
 * Check if Resend Contacts sync is enabled
 * @returns {boolean}
 */
export function isResendContactsSyncEnabled() {
  return !!RESEND_CONTACTS_CONFIG.audienceId;
}

