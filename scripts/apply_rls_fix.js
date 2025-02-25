// Script to apply RLS policy fixes to Supabase
// Run with: node scripts/apply_rls_fix.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file if needed
// require('dotenv').config();

// Replace these with your actual Supabase URL and service role key
// IMPORTANT: This requires the service role key, not the anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyRLSFix() {
  try {
    console.log('Applying RLS policy fixes...');
    
    // Read the migration SQL file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20240624_fix_events_rls.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL using the Supabase client
    const { error } = await supabase.rpc('pgtle_admin.install_extension_version_sql', {
      sql_code: sql,
      name: 'rls_fix',
      version: '1.0.0'
    });
    
    if (error) {
      console.error('Error applying RLS fixes:', error);
      return;
    }
    
    console.log('RLS policy fixes applied successfully!');
    
    // Verify the policies were created
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'events');
    
    if (policiesError) {
      console.error('Error fetching policies:', policiesError);
      return;
    }
    
    console.log('Current policies for events table:');
    console.table(policies);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

applyRLSFix(); 