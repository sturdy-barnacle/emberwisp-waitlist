# Database Merge and Deduplication Guide

This guide covers merging multiple waitlist databases and handling duplicate contacts.

**Last updated:** November 30, 2025

## Common Scenarios

### Scenario 1: Merging Two Separate Databases
- Site owner created second database for testing/staging
- Need to merge production data back together
- Some emails exist in both databases

### Scenario 2: Importing External Data
- Importing from Mailchimp, ConvertKit, CSV files
- External data has different schema/format
- Need to deduplicate against existing contacts

### Scenario 3: Multiple Waitlist Instances
- Different domains/subdomains with separate databases
- Consolidating into single CRM system
- Preserving all historical data

## Merge Strategy

### 1. Data Preservation Priority
When merging duplicate emails, preserve data in this order:
1. **Most recent confirmation** (if one is confirmed, keep confirmed)
2. **Richest metadata** (more complete record wins)
3. **Earliest first contact** (preserve original `first_seen_at`)
4. **Latest activity** (most recent `created_at` or `confirmed_at`)

### 2. Conflict Resolution Rules
- **Email verification**: `true` wins over `false`
- **Confirmation status**: `confirmed = true` wins over `false`
- **Timestamps**: Keep earliest `first_seen_at`, latest activity timestamps
- **Metadata**: Merge JSON objects, with newer data taking precedence
- **Source tracking**: Preserve all sources in metadata

## Deduplication Functions

### Function 1: Analyze Duplicates
```sql
-- Analyze potential duplicates before merging
-- Useful when importing data from external sources or merging databases
create or replace function public.analyze_duplicate_contacts()
returns table (
  email_normalized text,
  duplicate_count bigint,
  confirmed_count bigint,
  unconfirmed_count bigint,
  earliest_signup timestamptz,
  latest_activity timestamptz
)
language sql
security definer
as $$
  select 
    c.email_normalized,
    count(*) as duplicate_count,
    count(*) filter (where c.email_verified = true) as confirmed_count,
    count(*) filter (where c.email_verified = false) as unconfirmed_count,
    min(c.first_seen_at) as earliest_signup,
    max(greatest(c.created_at, coalesce(c.email_verified_at, c.created_at), coalesce(c.last_contacted_at, c.created_at))) as latest_activity
  from public.contacts c
  group by c.email_normalized
  having count(*) > 1
  order by duplicate_count desc, latest_activity desc;
$$;
```

### Function 2: Smart Contact Merge
```sql
-- Merge duplicate contacts intelligently
create or replace function public.merge_duplicate_contacts()
returns table (
  merged_email text,
  kept_contact_id uuid,
  removed_contact_ids uuid[],
  merge_details jsonb
)
language plpgsql
security definer
as $$
declare
  duplicate_record record;
  primary_contact record;
  secondary_contact record;
  removed_ids uuid[];
  merge_info jsonb;
begin
  -- Process each set of duplicates
  for duplicate_record in
    select email_normalized, array_agg(id order by 
      -- Priority: confirmed > unconfirmed, then earliest first_seen_at, then latest created_at
      email_verified desc,
      first_seen_at asc,
      created_at desc
    ) as contact_ids
    from public.contacts
    group by email_normalized
    having count(*) > 1
  loop
    -- Get primary contact (first in prioritized array)
    select * into primary_contact
    from public.contacts
    where id = duplicate_record.contact_ids[1];
    
    -- Initialize tracking
    removed_ids := array[]::uuid[];
    merge_info := jsonb_build_object(
      'primary_id', primary_contact.id,
      'merged_contacts', jsonb_build_array()
    );
    
    -- Process secondary contacts
    for i in 2..array_length(duplicate_record.contact_ids, 1) loop
      select * into secondary_contact
      from public.contacts
      where id = duplicate_record.contact_ids[i];
      
      -- Update primary contact with best data from secondary
      update public.contacts set
        -- Keep earliest first contact
        first_seen_at = least(primary_contact.first_seen_at, secondary_contact.first_seen_at),
        -- Keep latest activity
        last_contacted_at = greatest(
          coalesce(primary_contact.last_contacted_at, '1970-01-01'::timestamptz),
          coalesce(secondary_contact.last_contacted_at, '1970-01-01'::timestamptz)
        ),
        -- Merge metadata (primary wins on conflicts)
        metadata = primary_contact.metadata || secondary_contact.metadata,
        -- Keep verified status if either is verified
        email_verified = primary_contact.email_verified or secondary_contact.email_verified,
        -- Keep earliest verification date if verified
        email_verified_at = case
          when primary_contact.email_verified and secondary_contact.email_verified then
            least(primary_contact.email_verified_at, secondary_contact.email_verified_at)
          when primary_contact.email_verified then primary_contact.email_verified_at
          when secondary_contact.email_verified then secondary_contact.email_verified_at
          else null
        end,
        updated_at = now()
      where id = primary_contact.id;
      
      -- Update all references to point to primary contact
      update public.waitlist 
      set contact_id = primary_contact.id
      where contact_id = secondary_contact.id;
      
      update public.contact_activity
      set contact_id = primary_contact.id
      where contact_id = secondary_contact.id;
      
      -- Track merge details
      merge_info := jsonb_set(
        merge_info,
        '{merged_contacts}',
        (merge_info->'merged_contacts') || jsonb_build_object(
          'id', secondary_contact.id,
          'email', secondary_contact.email,
          'created_at', secondary_contact.created_at,
          'verified', secondary_contact.email_verified
        )
      );
      
      -- Add to removal list
      removed_ids := array_append(removed_ids, secondary_contact.id);
      
      -- Delete secondary contact
      delete from public.contacts where id = secondary_contact.id;
    end loop;
    
    -- Return merge results
    merged_email := primary_contact.email;
    kept_contact_id := primary_contact.id;
    removed_contact_ids := removed_ids;
    merge_details := merge_info;
    
    return next;
  end loop;
end;
$$;
```

### Function 3: Import External Data
```sql
-- Import and deduplicate external contact data
create or replace function public.import_external_contacts(
  import_data jsonb -- Array of contact objects
)
returns table (
  imported_count integer,
  updated_count integer,
  skipped_count integer,
  details jsonb
)
language plpgsql
security definer
as $$
declare
  contact_data jsonb;
  existing_contact record;
  import_count integer := 0;
  update_count integer := 0;
  skip_count integer := 0;
  result_details jsonb := jsonb_build_array();
begin
  -- Process each contact in import data
  for contact_data in select jsonb_array_elements(import_data) loop
    -- Check if contact exists
    select * into existing_contact
    from public.contacts
    where email_normalized = lower(trim(contact_data->>'email'));
    
    if existing_contact.id is not null then
      -- Update existing contact with new data (preserve existing verified status)
      update public.contacts set
        metadata = existing_contact.metadata || (contact_data->'metadata'),
        first_seen_at = least(
          existing_contact.first_seen_at,
          coalesce((contact_data->>'first_seen_at')::timestamptz, existing_contact.first_seen_at)
        ),
        updated_at = now()
      where id = existing_contact.id;
      
      update_count := update_count + 1;
      result_details := result_details || jsonb_build_object(
        'action', 'updated',
        'email', contact_data->>'email',
        'existing_id', existing_contact.id
      );
    else
      -- Create new contact
      insert into public.contacts (
        email,
        email_normalized,
        email_verified,
        email_verified_at,
        first_seen_at,
        metadata
      ) values (
        contact_data->>'email',
        lower(trim(contact_data->>'email')),
        coalesce((contact_data->>'email_verified')::boolean, false),
        (contact_data->>'email_verified_at')::timestamptz,
        coalesce((contact_data->>'first_seen_at')::timestamptz, now()),
        coalesce(contact_data->'metadata', '{}'::jsonb)
      );
      
      import_count := import_count + 1;
      result_details := result_details || jsonb_build_object(
        'action', 'created',
        'email', contact_data->>'email'
      );
    end if;
  end loop;
  
  imported_count := import_count;
  updated_count := update_count;
  skipped_count := skip_count;
  details := result_details;
  
  return next;
end;
$$;
```

## Usage Examples

### 1. Analyze Before Merging
```sql
-- See what duplicates exist
SELECT * FROM public.analyze_duplicate_contacts();
```

### 2. Merge Duplicates
```sql
-- Perform smart merge
SELECT * FROM public.merge_duplicate_contacts();
```

### 3. Import External Data
```sql
-- Import from JSON array
SELECT * FROM public.import_external_contacts('[
  {
    "email": "user@example.com",
    "email_verified": true,
    "first_seen_at": "2024-01-01T00:00:00Z",
    "metadata": {"source": "mailchimp", "tags": ["newsletter"]}
  }
]'::jsonb);
```

## Best Practices

### Before Merging
1. **Backup everything** - Export both databases
2. **Analyze duplicates** - Run analysis function first
3. **Test on copy** - Never merge production directly
4. **Document conflicts** - Note any data loss decisions

### During Merge
1. **Run in transaction** - Can rollback if issues
2. **Monitor progress** - Functions return detailed results
3. **Verify results** - Check merged data makes sense

### After Merge
1. **Update references** - Ensure all foreign keys updated
2. **Rebuild stats** - Refresh materialized views
3. **Test functionality** - Verify waitlist still works
4. **Clean up** - Remove temporary data/functions if needed
5. **Sync to Resend** - If using Resend Contacts sync, sync merged contacts (see below)

## Syncing to Resend Contacts After Merge

If you're using the optional Resend Contacts sync feature, you'll need to sync your merged contacts to Resend Audience. This ensures your Resend Audience stays in sync with your Supabase database after merging.

### Prerequisites

**1. Audience ID Required**

You **must** specify a Resend Audience ID before syncing contacts. This is done via the `RESEND_AUDIENCE_ID` environment variable:

```bash
RESEND_AUDIENCE_ID=your-audience-id-here
```

To get your Audience ID:
1. Go to [resend.com/audiences](https://resend.com/audiences)
2. Create an Audience (or select an existing one)
3. Copy the Audience ID from the dashboard

**2. Custom Properties Must Be Created First**

**Important:** If you want to sync custom properties (beyond `firstName` and `lastName`), you **must** create these properties in the Resend dashboard **before** attempting to sync contacts via the API.

**Steps to create custom properties:**
1. Go to [resend.com/audiences](https://resend.com/audiences)
2. Click on your Audience
3. Navigate to **Properties** tab
4. Click **Add Property**
5. Configure the property:
   - **Key**: Alphanumeric and underscores only, up to 50 characters (e.g., `company_name`, `signup_source`)
   - **Type**: String or Number
   - **Fallback Value**: Optional default value
6. Save the property

**Why this matters:** Resend will reject API requests that include properties that don't exist in the dashboard. Only `email`, `firstName`, `lastName`, and `unsubscribed` are available by default. All other properties must be pre-created.

### Syncing Merged Contacts

After merging databases, use the bulk sync script to sync all confirmed, non-bounced, non-unsubscribed contacts to Resend:

```bash
# From the-widget directory
cd the-widget

# Preview what would be synced (dry run)
node scripts/sync-contacts-to-resend.js --dry-run

# Sync all eligible contacts
node scripts/sync-contacts-to-resend.js
```

**What gets synced:**
- Only contacts where `email_verified = true`
- Only contacts where `email_bounced = false`
- Only contacts where `email_unsubscribed = false`
- Contacts are synced with:
  - `email` (required)
  - `firstName` from `metadata.first_name` (if available)
  - `lastName` from `metadata.last_name` (if available)
  - `unsubscribed = false` (for confirmed contacts)

**Custom properties:**
If you've created custom properties in the Resend dashboard, you can extend the sync script to include them. The current implementation only syncs `firstName` and `lastName`. To sync additional properties:

1. Create the properties in Resend dashboard first (see above)
2. Modify `the-widget/scripts/sync-contacts-to-resend.js` to include properties in the `resend.contacts.create()` call:
   ```javascript
   const { data, error } = await resend.contacts.create({
     audienceId: AUDIENCE_ID,
     email: contact.email,
     firstName: contact.metadata?.first_name || '',
     lastName: contact.metadata?.last_name || '',
     unsubscribed: false,
     properties: {
       company_name: contact.metadata?.company_name || '',
       signup_source: contact.metadata?.source || '',
       // Add other custom properties here
     },
   });
   ```

**Note:** The same property creation requirement applies to the automatic sync in `api/shared/resend-contacts.js`. If you modify that file to include custom properties, ensure they exist in the Resend dashboard first.

### Troubleshooting Sync Issues

**Error: "Property X does not exist"**
- **Solution:** Create the property in Resend dashboard first (see "Custom Properties Must Be Created First" above)

**Error: "Audience ID is required"**
- **Solution:** Set `RESEND_AUDIENCE_ID` environment variable with your Audience ID

**Contacts not syncing:**
- Check that contacts meet sync criteria (`email_verified = true`, not bounced, not unsubscribed)
- Verify `RESEND_API_KEY` is set correctly
- Check script output for specific error messages

**Duplicate contacts in Resend:**
- Resend will automatically handle duplicates if a contact already exists
- The sync script will show "Already exists" for contacts that are already in the Audience

## Recovery

If merge goes wrong:
1. **Restore from backup** - Always have this option
2. **Check transaction log** - See what was changed
3. **Manual fixes** - Use merge details JSON to understand changes
4. **Re-run selectively** - Process specific emails only

## Integration with CRM

These functions prepare data for CRM by:
- ✅ Ensuring single contact per email
- ✅ Preserving all historical data
- ✅ Maintaining referential integrity
- ✅ Creating audit trail of merges

The CRM can then build on this clean, deduplicated foundation.
