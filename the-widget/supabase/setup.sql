-- Setup script for emberwisp waitlist widget
-- Complete setup including waitlist table and unified contacts system
-- Run this file in Supabase SQL Editor
--
-- NOTE: This database schema is email-service agnostic, but the API code uses Resend.
-- The email_bounced and email_unsubscribed fields can be updated via Resend webhooks
-- or any other email service integration.
--
-- For new installations: Just run this file - that's it!
-- For existing installations: Run this file, then migrate existing data (see instructions below)

-- ============================================
-- Step 0: Create waitlist table (if it doesn't exist)
-- ============================================

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  source text default 'website',
  created_at timestamptz default now(),
  
  -- Double opt-in fields
  confirmed boolean default false,
  confirmed_at timestamptz,
  confirmation_token text,
  token_expires_at timestamptz,
  
  -- Optional metadata
  metadata jsonb default '{}'::jsonb
);

-- Add indexes for performance (if not exists)
create index if not exists waitlist_email_idx on public.waitlist (email);
create index if not exists waitlist_created_at_idx on public.waitlist (created_at desc);
create index if not exists waitlist_confirmation_token_idx on public.waitlist (confirmation_token);
create index if not exists waitlist_confirmed_idx on public.waitlist (confirmed);

-- Enable Row Level Security (if not already enabled)
alter table public.waitlist enable row level security;

-- Create policy (drop and recreate to avoid conflicts)
drop policy if exists "Service role only" on public.waitlist;
create policy "Service role only" on public.waitlist
  for all
  using (auth.role() = 'service_role');

-- Stats view (will be updated later to include contacts)
create or replace view public.waitlist_stats as
select 
  count(*) filter (where confirmed = true) as confirmed_signups,
  count(*) filter (where confirmed = false) as pending_signups,
  count(*) as total_signups,
  count(*) filter (where confirmed = true and confirmed_at > now() - interval '24 hours') as confirmed_last_24h,
  count(*) filter (where confirmed = true and confirmed_at > now() - interval '7 days') as confirmed_last_7d,
  count(distinct source) as unique_sources
from public.waitlist;

-- Optional: Clean up expired unconfirmed signups (run periodically)
create or replace function public.cleanup_expired_waitlist()
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  delete from public.waitlist
  where confirmed = false
    and created_at < now() - interval '7 days';
  
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- ============================================
-- Step 1: Create contacts table (unified identity)
-- ============================================

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  email_normalized text unique not null, -- lowercase, trimmed for lookups
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Supabase Auth integration (optional - links to auth.users when contact creates account)
  -- NULL for waitlist signups that never create accounts - this is expected and safe
  user_id uuid references auth.users(id) on delete set null,
  
  -- Email preferences and status
  -- These fields are email-service agnostic but designed to work with Resend webhooks
  -- Update via webhook handlers or manual updates
  email_verified boolean default false,
  email_verified_at timestamptz,
  email_bounced boolean default false,
  email_bounced_at timestamptz,
  email_unsubscribed boolean default false,
  email_unsubscribed_at timestamptz,
  unsubscribe_token text unique, -- For secure unsubscribe links
  
  -- Unified metadata (can store any contact-level data)
  metadata jsonb default '{}'::jsonb,
  
  -- Lifecycle tracking
  first_seen_at timestamptz default now(),
  last_contacted_at timestamptz
);

-- Add unsubscribe_token column if it doesn't exist (for existing installations)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'contacts' 
    and column_name = 'unsubscribe_token'
  ) then
    alter table public.contacts add column unsubscribe_token text unique;
  end if;
end $$;

-- Indexes for contacts
create index if not exists contacts_email_idx on public.contacts (email);
create index if not exists contacts_email_normalized_idx on public.contacts (email_normalized);
create index if not exists contacts_user_id_idx on public.contacts (user_id) where user_id is not null;
create index if not exists contacts_created_at_idx on public.contacts (created_at desc);
create index if not exists contacts_email_verified_idx on public.contacts (email_verified);
create index if not exists contacts_email_bounced_idx on public.contacts (email_bounced);
create index if not exists contacts_email_unsubscribed_idx on public.contacts (email_unsubscribed);
create index if not exists contacts_unsubscribe_token_idx on public.contacts (unsubscribe_token) where unsubscribe_token is not null;
create index if not exists contacts_first_seen_at_idx on public.contacts (first_seen_at desc);
create index if not exists contacts_last_contacted_at_idx on public.contacts (last_contacted_at desc);

-- Enable Row Level Security
alter table public.contacts enable row level security;

-- Service role only policy
create policy "Service role only" on public.contacts
  for all
  using (auth.role() = 'service_role');

-- Function to update updated_at timestamp
create or replace function public.update_contacts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger contacts_updated_at
  before update on public.contacts
  for each row
  execute function public.update_contacts_updated_at();

-- ============================================
-- Step 2: Migrate existing waitlist data to contacts
-- ============================================

-- This function migrates existing waitlist entries to contacts
-- Run this if you have existing waitlist data
create or replace function public.migrate_waitlist_to_contacts()
returns integer
language plpgsql
security definer
as $$
declare
  migrated_count integer := 0;
  waitlist_record record;
  contact_id uuid;
begin
  -- Loop through existing waitlist entries
  for waitlist_record in 
    select distinct email from public.waitlist
  loop
    -- Check if contact already exists
    select id into contact_id
    from public.contacts
    where email_normalized = lower(trim(waitlist_record.email));
    
    -- Create contact if doesn't exist
    if contact_id is null then
      insert into public.contacts (email, email_normalized, email_verified, email_verified_at, first_seen_at)
      select 
        email,
        lower(trim(email)) as email_normalized,
        confirmed as email_verified,
        confirmed_at as email_verified_at,
        created_at as first_seen_at
      from public.waitlist
      where email = waitlist_record.email
      order by created_at asc
      limit 1
      returning id into contact_id;
    end if;
    
    migrated_count := migrated_count + 1;
  end loop;
  
  return migrated_count;
end;
$$;

-- ============================================
-- Step 3: Add contact_id to waitlist (optional migration)
-- ============================================

-- Add contact_id column (nullable for backward compatibility)
alter table public.waitlist 
  add column if not exists contact_id uuid references public.contacts(id) on delete cascade;

-- Create index for contact_id lookups
create index if not exists waitlist_contact_id_idx on public.waitlist (contact_id);

-- Function to populate contact_id for existing records
create or replace function public.populate_waitlist_contact_ids()
returns integer
language plpgsql
security definer
as $$
declare
  updated_count integer := 0;
  waitlist_record record;
  found_contact_id uuid;
begin
  -- Update waitlist entries that don't have contact_id
  for waitlist_record in
    select id, email from public.waitlist where contact_id is null
  loop
    -- Find matching contact
    select id into found_contact_id
    from public.contacts
    where email_normalized = lower(trim(waitlist_record.email));
    
    -- Update waitlist entry
    if found_contact_id is not null then
      update public.waitlist
      set contact_id = found_contact_id
      where id = waitlist_record.id;
      
      updated_count := updated_count + 1;
    end if;
  end loop;
  
  return updated_count;
end;
$$;

-- ============================================
-- Step 4: Update waitlist_stats view to use contacts
-- ============================================

-- Updated stats view that can work with or without contacts
create or replace view public.waitlist_stats as
select 
  count(*) filter (where confirmed = true) as confirmed_signups,
  count(*) filter (where confirmed = false) as pending_signups,
  count(*) as total_signups,
  count(*) filter (where confirmed = true and confirmed_at > now() - interval '24 hours') as confirmed_last_24h,
  count(*) filter (where confirmed = true and confirmed_at > now() - interval '7 days') as confirmed_last_7d,
  count(distinct source) as unique_sources,
  -- New: count of unique contacts
  count(distinct contact_id) filter (where contact_id is not null) as unique_contacts
from public.waitlist;

-- ============================================
-- Step 5: Helper function to get or create contact
-- ============================================

-- This function is used by the API to get or create a contact
create or replace function public.get_or_create_contact(email_address text)
returns uuid
language plpgsql
security definer
as $$
declare
  normalized_email text;
  contact_uuid uuid;
begin
  normalized_email := lower(trim(email_address));
  
  -- Try to find existing contact
  select id into contact_uuid
  from public.contacts
  where email_normalized = normalized_email;
  
  -- Create if doesn't exist
  if contact_uuid is null then
    insert into public.contacts (email, email_normalized, first_seen_at)
    values (email_address, normalized_email, now())
    returning id into contact_uuid;
  end if;
  
  return contact_uuid;
end;
$$;

-- ============================================
-- Step 6: Contact activity timeline (optional, for future CRM)
-- ============================================

-- Contact activity timeline table for tracking all contact interactions
-- This is optional and can be added when implementing CRM features
create table if not exists public.contact_activity (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete cascade,
  activity_type text not null, -- 'contact_created', 'waitlist_signup', 'waitlist_confirmed', 'email_sent', etc.
  activity_data jsonb default '{}'::jsonb, -- Additional data specific to the activity
  created_at timestamptz default now() -- UTC timestamp, can be converted to epoch in API responses
);

-- Indexes for contact_activity
create index if not exists contact_activity_contact_id_idx on public.contact_activity (contact_id);
create index if not exists contact_activity_created_at_idx on public.contact_activity (created_at desc);
create index if not exists contact_activity_type_idx on public.contact_activity (activity_type);
create index if not exists contact_activity_contact_type_idx on public.contact_activity (contact_id, activity_type);

-- Enable Row Level Security
alter table public.contact_activity enable row level security;

-- Service role only policy
create policy "Service role only" on public.contact_activity
  for all
  using (auth.role() = 'service_role');

-- ============================================
-- Step 7: Unsubscribe token generation function
-- ============================================

-- Function to generate unsubscribe tokens for contacts that don't have them
create or replace function public.generate_unsubscribe_tokens()
returns integer
language plpgsql
security definer
as $$
declare
  updated_count integer := 0;
begin
  -- Generate tokens for contacts without them
  update public.contacts 
  set unsubscribe_token = encode(gen_random_bytes(32), 'hex')
  where unsubscribe_token is null;
  
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- NOTE: For existing installations, run this to generate tokens for existing contacts:
-- SELECT public.generate_unsubscribe_tokens();

-- ============================================
-- Step 8: Database merge and deduplication functions (optional)
-- ============================================

-- Analyze potential duplicate contacts before merging
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

-- Smart merge of duplicate contacts with data preservation
-- Keeps the "best" contact record and merges data from duplicates
-- Returns detailed merge information including removed IDs and merge details
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

-- Import and deduplicate external contact data
-- Useful for importing from Mailchimp, ConvertKit, CSV files, etc.
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

-- ============================================
-- Setup Instructions:
-- ============================================
-- NEW INSTALLATIONS:
-- 1. Run this file in Supabase SQL Editor - that's it!
--    This creates both waitlist and contacts tables
--    New signups will automatically create contacts
--
-- EXISTING INSTALLATIONS (if you have waitlist data):
-- 1. Run this file in Supabase SQL Editor (safe to run, won't break existing data)
-- 2. Migrate existing waitlist entries to contacts:
--    SELECT public.migrate_waitlist_to_contacts();
--    SELECT public.populate_waitlist_contact_ids();
-- 3. Your API code already uses contacts (backward compatible)
--
-- MERGING MULTIPLE DATABASES:
-- 1. BACKUP EVERYTHING FIRST - Export both databases
-- 2. Import data into single database (using pg_dump/restore or manual import)
-- 3. Analyze duplicates: SELECT * FROM public.analyze_duplicate_contacts();
-- 4. Merge duplicates: SELECT * FROM public.merge_duplicate_contacts();
-- 5. Verify results and test functionality
-- 
-- For detailed instructions, best practices, and usage examples, see:
-- DATABASE_MERGE_GUIDE.md in docs/ folder

