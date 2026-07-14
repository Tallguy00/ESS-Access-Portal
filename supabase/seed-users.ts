import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file if available
dotenv.config();

const rawUrl = process.env.SUPABASE_URL || "https://kbqlhumzcfenjumhaznf.supabase.co";
// Clean URL from any trailing /rest/v1/ or slashes
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.warn("⚠️ Warning: SUPABASE_SERVICE_ROLE_KEY environment variable is not defined.");
  console.warn("Please run the script providing the environment variables. Example:");
  console.warn("  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key npx tsx supabase/seed_users.ts\n");
}

// Create Supabase client with Service Role Key to bypass RLS and use Admin Auth APIs
const supabase = createClient(supabaseUrl, supabaseServiceKey || 'placeholder-key', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const defaultUsers = [
  {
    email: '',
    password: '',
    fullName: '',
    role: '',
    departmentId: '',
  }

];

async function seed() {
  if (!supabaseServiceKey) {
    console.error("❌ Error: Cannot run seed process without SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  console.log("🚀 Starting Supabase User Seeding Process...");
  console.log(`🔗 Target Supabase URL: ${supabaseUrl}\n`);

  // Fetch existing auth users to prevent duplicates
  const { data, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("❌ Failed to list existing authentication users:", listError.message);
    process.exit(1);
  }

  const usersList = (data?.users || []) as any[];

  for (const defaultUser of defaultUsers) {
    try {
      console.log(`\n-----------------------------------------`);
      console.log(`👤 Processing user: ${defaultUser.fullName} (${defaultUser.email})...`);

      // Find if user already exists in auth.users
      const existingAuthUser = usersList.find(u => u.email?.toLowerCase().trim() === defaultUser.email.toLowerCase().trim());
      let authUserId: string;

      if (existingAuthUser) {
        authUserId = existingAuthUser.id;
        console.log(`ℹ️ User already exists in Supabase Authentication (ID: ${authUserId}).`);
        
        // Update user password and metadata if needed
        const { error: updateAuthError } = await supabase.auth.admin.updateUserById(authUserId, {
          password: defaultUser.password,
          email_confirm: true,
          user_metadata: {
            full_name: defaultUser.fullName,
            role: defaultUser.role,
            department_id: defaultUser.departmentId
          }
        });

        if (updateAuthError) {
          console.warn(`⚠️ Warning: Failed to update auth credentials for ${defaultUser.email}:`, updateAuthError.message);
        } else {
          console.log(`✅ Updated auth credentials successfully.`);
        }
      } else {
        // Create new user in auth.users
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
          email: defaultUser.email,
          password: defaultUser.password,
          email_confirm: true,
          user_metadata: {
            full_name: defaultUser.fullName,
            role: defaultUser.role,
            department_id: defaultUser.departmentId
          }
        });

        if (createError) {
          console.error(`❌ Failed to create auth user ${defaultUser.email}:`, createError.message);
          continue;
        }

        authUserId = createData.user.id;
        console.log(`✅ Successfully created Auth user! (ID: ${authUserId})`);
      }

      // Sync user profile in public.profiles table
      console.log(`🔄 Upserting profile record in public.profiles table...`);
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authUserId,
          full_name: defaultUser.fullName,
          email: defaultUser.email,
          role: defaultUser.role,
          department_id: defaultUser.departmentId,
          status: 'Active'
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error(`❌ Failed to upsert public.profiles record for ${defaultUser.email}:`, profileError.message);
      } else {
        console.log(`🎉 Successfully synced profile record for ${defaultUser.fullName} (Role: ${defaultUser.role}, Status: Active)!`);
      }

    } catch (err: any) {
      console.error(`❌ Unexpected error processing ${defaultUser.email}:`, err.message || err);
    }
  }

  console.log(`\n=========================================`);
  console.log("🏁 Supabase User Seeding Completed!");
}

seed();
