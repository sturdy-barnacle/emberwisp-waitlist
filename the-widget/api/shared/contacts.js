// Contact management utilities for unified contacts system
// Handles getting/creating contacts and updating contact status

import { supabase } from './database.js';
import { normalizeEmail, generateToken } from './utils.js';

/**
 * Get or create a contact using the unified contacts system
 * Falls back gracefully if contacts table doesn't exist
 * @param {string} email - Email address
 * @returns {Promise<{contactId: string, email: string} | null>} - Contact info or null if contacts unavailable
 */
export async function getOrCreateContact(email) {
  const normalizedEmail = normalizeEmail(email);
  
  try {
    // Try to use the database function (if contacts table exists)
    const { data: contactId, error: functionError } = await supabase.rpc(
      'get_or_create_contact',
      { email_address: email }
    );
    
    if (!functionError && contactId) {
      return { contactId, email: normalizedEmail };
    }
    
    // Fallback: check if contact exists directly
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id, unsubscribe_token')
      .eq('email_normalized', normalizedEmail)
      .single();

    if (existingContact) {
      // Generate unsubscribe token if missing
      let unsubscribeToken = existingContact.unsubscribe_token;
      if (!unsubscribeToken) {
        unsubscribeToken = generateToken();
        await supabase
          .from('contacts')
          .update({ unsubscribe_token: unsubscribeToken })
          .eq('id', existingContact.id);
      }
      
      return { 
        contactId: existingContact.id, 
        email: normalizedEmail,
        unsubscribeToken 
      };
    }
    
    // Create new contact with unsubscribe token
    const { data: newContact, error: createError } = await supabase
      .from('contacts')
      .insert({
        email: email,
        email_normalized: normalizedEmail,
        first_seen_at: new Date().toISOString(),
        unsubscribe_token: generateToken() // Generate secure unsubscribe token
      })
      .select('id, unsubscribe_token')
      .single();
    
    if (createError) {
      // Contacts table might not exist - return null to use fallback
      return null;
    }
    
    return { 
      contactId: newContact.id, 
      email: normalizedEmail,
      unsubscribeToken: newContact.unsubscribe_token 
    };
  } catch (error) {
    // Contacts system not available - use fallback
    return null;
  }
}

/**
 * Update contact email verification status
 * Used when a user confirms their email address
 * @param {string} contactId - Contact UUID
 * @param {string} timestamp - ISO timestamp string
 * @returns {Promise<void>}
 */
export async function updateContactVerified(contactId, timestamp) {
  try {
    await supabase
      .from('contacts')
      .update({
        email_verified: true,
        email_verified_at: timestamp,
        last_contacted_at: timestamp,
        updated_at: timestamp
      })
      .eq('id', contactId);
  } catch (error) {
    // Contacts table might not exist - that's okay
    console.log('Contact update skipped (contacts table may not exist)');
  }
}

/**
 * Update contact by email (fallback if contact_id not available)
 * @param {string} email - Email address
 * @param {string} timestamp - ISO timestamp string
 * @returns {Promise<void>}
 */
export async function updateContactVerifiedByEmail(email, timestamp) {
  try {
    const normalizedEmail = normalizeEmail(email);
    await supabase
      .from('contacts')
      .update({
        email_verified: true,
        email_verified_at: timestamp,
        last_contacted_at: timestamp,
        updated_at: timestamp
      })
      .eq('email_normalized', normalizedEmail);
  } catch (error) {
    // Contacts table might not exist - that's okay
    console.log('Contact update skipped (contacts table may not exist)');
  }
}

