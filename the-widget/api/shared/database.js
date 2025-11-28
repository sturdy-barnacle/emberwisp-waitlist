// Database client initialization and shared database utilities
// ⚠️ SUPABASE REQUIRED: This uses Supabase for database operations

import { createClient } from '@supabase/supabase-js';
import { DATABASE_CONFIG } from './config.js';

// Initialize Supabase client
// This is a singleton - initialized once and reused across all API endpoints
export const supabase = createClient(
  DATABASE_CONFIG.supabaseUrl,
  DATABASE_CONFIG.supabaseServiceKey
);

