#!/usr/bin/env node

/**
 * Bulk sync script: Sync existing confirmed contacts to Resend Audience
 * 
 * This is a one-time migration script to sync all existing confirmed,
 * non-bounced, non-unsubscribed contacts to your Resend Audience.
 * 
 * Usage:
 *   node scripts/sync-contacts-to-resend.js
 * 
 * Options:
 *   --dry-run    Preview what would be synced without making changes
 *   --limit N    Only sync first N contacts (for testing)
 * 
 * Environment variables required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *   RESEND_API_KEY
 *   RESEND_AUDIENCE_ID
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;

// Validate environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY', 
  'RESEND_API_KEY',
  'RESEND_AUDIENCE_ID'
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  console.error('\nMake sure to set these in your .env file or environment.');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

// Stats tracking
const stats = {
  total: 0,
  synced: 0,
  skipped: 0,
  failed: 0,
  alreadyExists: 0
};

/**
 * Sync a single contact to Resend
 */
async function syncContact(contact) {
  try {
    const { data, error } = await resend.contacts.create({
      audienceId: AUDIENCE_ID,
      email: contact.email,
      firstName: contact.metadata?.first_name || '',
      lastName: contact.metadata?.last_name || '',
      unsubscribed: false,
    });

    if (error) {
      if (error.message?.includes('already exists')) {
        stats.alreadyExists++;
        return { status: 'exists', email: contact.email };
      }
      stats.failed++;
      return { status: 'failed', email: contact.email, error: error.message };
    }

    stats.synced++;
    return { status: 'synced', email: contact.email, id: data?.id };
  } catch (err) {
    stats.failed++;
    return { status: 'failed', email: contact.email, error: err.message };
  }
}

/**
 * Main sync function
 */
async function main() {
  console.log('🔄 Resend Contacts Bulk Sync');
  console.log('============================\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  console.log(`📊 Audience ID: ${AUDIENCE_ID}`);
  console.log(`📦 Limit: ${limit || 'None (all contacts)'}\n`);

  // Build query for eligible contacts
  let query = supabase
    .from('contacts')
    .select('id, email, metadata, email_verified, email_bounced, email_unsubscribed')
    .eq('email_verified', true)
    .eq('email_bounced', false)
    .eq('email_unsubscribed', false)
    .order('created_at', { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: contacts, error } = await query;

  if (error) {
    console.error('❌ Failed to fetch contacts:', error.message);
    process.exit(1);
  }

  stats.total = contacts.length;
  console.log(`📋 Found ${stats.total} eligible contacts to sync\n`);

  if (stats.total === 0) {
    console.log('✅ No contacts to sync. Done!');
    process.exit(0);
  }

  if (dryRun) {
    console.log('Contacts that would be synced:');
    contacts.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.email}`);
    });
    console.log('\n✅ Dry run complete. Run without --dry-run to sync.');
    process.exit(0);
  }

  // Sync contacts with rate limiting
  console.log('Starting sync...\n');
  
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    const result = await syncContact(contact);
    
    const icon = result.status === 'synced' ? '✓' : 
                 result.status === 'exists' ? '○' : '✗';
    const status = result.status === 'synced' ? 'Synced' :
                   result.status === 'exists' ? 'Already exists' : 
                   `Failed: ${result.error}`;
    
    console.log(`${icon} [${i + 1}/${contacts.length}] ${contact.email} - ${status}`);
    
    // Rate limit: 100ms between requests to avoid hitting Resend limits
    if (i < contacts.length - 1) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // Print summary
  console.log('\n============================');
  console.log('📊 Sync Complete!\n');
  console.log(`   Total contacts:    ${stats.total}`);
  console.log(`   ✓ Synced:          ${stats.synced}`);
  console.log(`   ○ Already existed: ${stats.alreadyExists}`);
  console.log(`   ✗ Failed:          ${stats.failed}`);
  console.log(`   - Skipped:         ${stats.skipped}`);
  console.log('');

  if (stats.failed > 0) {
    console.log('⚠️  Some contacts failed to sync. Check the logs above for details.');
    process.exit(1);
  }

  console.log('✅ All done!');
}

// Run the script
main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});

