# Database Setup

This directory contains the SQL setup script for the waitlist widget database.

## Email Service Compatibility

**⚠️ Important:** The database schema is **email-service agnostic** and will work with any email provider (Resend, SendGrid, Mailgun, AWS SES, etc.). However, the **API code requires Resend**.

- ✅ **Database schema:** Works with any email service - no changes needed
- ❌ **API code (`api/shared/email-service.js`):** Uses Resend by default
  - If you want to use a different email service, modify `api/shared/email-service.js`
  - See `api/shared/README.md` for customization examples

The schema includes fields like `email_bounced` and `email_unsubscribed` that can be updated via Resend webhooks or any other email service's webhook system.

**Resend Contacts Sync:** The optional Resend Contacts sync feature uses existing database fields - no schema changes required. When enabled, the API automatically syncs subscription status between Supabase and Resend Audiences. See the main [README.md](../../README.md#2b-set-up-resend-contacts-sync-optional) for setup instructions.

## Setup File

### `setup.sql` - Complete Setup (Recommended)

**Complete setup file** - Creates both waitlist and unified contacts tables. This is the default and recommended option.

**Includes:**
- Waitlist table with double opt-in support
- Unified contacts table (single source of truth for email identity)
- Email status fields (`email_bounced`, `email_unsubscribed`) - can be updated via Resend webhooks or any email service's webhook system
- Integration ready for mailing lists, app users, and CRM systems
- Unified email preferences
- All indexes, views, and helper functions

**⚠️ Email Service Requirement:** The database schema is generic and works with any email service. However, the **API code uses Resend by default**. If you want to use a different email service (SendGrid, Mailgun, AWS SES, etc.), modify `api/shared/email-service.js`. See `api/shared/README.md` for customization examples.

**For new installations:**
```sql
-- Just run setup.sql in Supabase SQL Editor
-- That's it! Everything is set up.
```

**For existing installations:**
- Run `setup.sql` - it will detect your existing waitlist table and add contacts
- Then migrate existing data (see instructions below)

**Note:** This file is self-contained and safe to run multiple times. It uses `if not exists` checks, so it won't break existing installations.

## Quick Start

### New Installation

1. Open Supabase **SQL Editor**
2. Run `setup.sql`
3. Done! ✅

### Existing Installation

If you already have a waitlist table with data:
1. Run `setup.sql` (it will add contacts to your existing setup)
2. Migrate existing waitlist entries to contacts:
   ```sql
   SELECT public.migrate_waitlist_to_contacts();
   SELECT public.populate_waitlist_contact_ids();
   ```
3. Your API code already uses contacts (backward compatible)

## Backward Compatibility

The setup script is **backward compatible**. The waitlist widget will work with or without the contacts table. The API automatically detects if contacts exist and uses them if available.

## What Gets Created

- `waitlist` table - Stores waitlist signups
- `contacts` table - Unified email identity (single source of truth)
  - Optional `user_id` column for Supabase Auth integration (links to `auth.users` when contact creates account)
  - NULL for waitlist signups that never create accounts - this is expected and safe
- `waitlist_stats` view - Statistics view
- Helper functions - `get_or_create_contact()`, migration functions, etc.
- Indexes - For performance (including `contacts_user_id_idx` for fast auth user lookups)
- Row Level Security - Service role only access

## Next Steps

After running setup:
1. ✅ Test waitlist signup flow
2. ✅ Verify contacts are created automatically
3. 📖 See `docs/crm_planning.md` for CRM system design
