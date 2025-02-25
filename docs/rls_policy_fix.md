# Row Level Security (RLS) Policy Fix

## Issue

We encountered a permissions error when trying to create new events in the FlashVote application. The error message was:

```
Error creating event: {
  code: '42501',
  details: null,
  hint: null,
  message: 'new row violates row-level security policy for table "events"'
}
```

This error occurs because our Supabase database has Row Level Security (RLS) enabled for the `events` table, but we're missing a policy that allows authenticated users to create new events.

## Solution

We need to add the following RLS policies to our Supabase database:

1. A policy that allows authenticated users to create events
2. Policies that allow event owners and admins to manage items, locations, and subjects
3. A policy that allows event owners to manage admins

## How to Fix

### Option 1: Using the Supabase SQL Editor

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the `scripts/fix_rls_policies.sql` file
4. Paste it into the SQL Editor and run the query

### Option 2: Using the Supabase CLI

If you have the Supabase CLI installed, you can apply the changes by:

1. Make sure your local schema.sql file is updated with the new policies
2. Run the following command:

```bash
supabase db push
```

### Option 3: Manual Policy Creation

If you prefer to add the policies manually through the Supabase dashboard:

1. Log in to your Supabase dashboard
2. Navigate to Authentication > Policies
3. For each table (events, items, locations, subjects, admins), add the corresponding policies as described in the `scripts/fix_rls_policies.sql` file

## Verification

After applying the fix, you should be able to create new events without encountering the RLS policy violation error. You can verify that the policies were added correctly by:

1. Log in to your Supabase dashboard
2. Navigate to Authentication > Policies
3. Check that the new policies are listed for each table

## Policies Added

### events table
- "Authenticated users can create events" - Allows users to create events where they are the owner

### items table
- "Event owners and admins can manage items" - Allows event owners and admins to create, read, update, and delete items

### locations table
- "Event owners and admins can manage locations" - Allows event owners and admins to create, read, update, and delete locations

### subjects table
- "Event owners and admins can manage subjects" - Allows event owners and admins to create, read, update, and delete subjects

### admins table
- "Event owners can manage admins" - Allows event owners to create, read, update, and delete admin records

## Additional Notes

- These policies ensure that users can only create and manage resources they have permission to access
- The policies use the `auth.uid()` function to get the current user's ID and compare it with the resource owner
- For items, locations, and subjects, the policies check if the user is either the event owner or an admin with appropriate permissions 