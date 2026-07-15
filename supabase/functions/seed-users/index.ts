import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const defaultUsers = [
  {
    email: 'admin@company.com',
    password: 'AdminIT123',
    fullName: 'IT Administrator',
    role: 'IT Admin',
    departmentId: 'dep-ops',
  },
  {
    email: 'super@company.com',
    password: 'SuperAdmin123',
    fullName: 'Super Administrator',
    role: 'Super Admin',
    departmentId: 'dep-ops',
  },
  {
    email: 'manager.fin@company.com',
    password: 'Manager123',
    fullName: 'Finance Manager',
    role: 'Manager',
    departmentId: 'dep-fin',
  },
  {
    email: 'manager.eng@company.com',
    password: 'Manager123',
    fullName: 'Engineering Manager',
    role: 'Manager',
    departmentId: 'dep-eng',
  },
  {
    email: 'manager.hr@company.com',
    password: 'Manager123',
    fullName: 'HR Manager',
    role: 'Manager',
    departmentId: 'dep-hr',
  },
  {
    email: 'manager.mkt@company.com',
    password: 'Manager123',
    fullName: 'Marketing Manager',
    role: 'Manager',
    departmentId: 'dep-mkt',
  },
  {
    email: 'manager.ops@company.com',
    password: 'Manager123',
    fullName: 'Operations Manager',
    role: 'Manager',
    departmentId: 'dep-ops',
  }
];

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase Client using local environment Service Role Key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("🚀 Starting Edge Function: seed-users...");
    const results = [];

    // Fetch existing users to prevent duplicates
    const { data, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Failed to list auth users: ${listError.message}`);
    }

    const users = data?.users ?? [];

    for (const defaultUser of defaultUsers) {
      let authUserId = "";
      let actionTaken = "";
      let profileStatus = "";

      const existingAuthUser = users.find(
        (u) => u.email?.toLowerCase().trim() === defaultUser.email.toLowerCase().trim()
      );

      if (existingAuthUser) {
        authUserId = existingAuthUser.id;
        actionTaken = "Updated existing user credentials";

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
          console.warn(`⚠️ Error updating auth details for ${defaultUser.email}:`, updateAuthError.message);
        }
      } else {
        actionTaken = "Created new auth user";
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
          results.push({ email: defaultUser.email, success: false, error: createError.message });
          continue;
        }

        authUserId = createData.user.id;
      }

      // Upsert into profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: authUserId,
          full_name: defaultUser.fullName,
          email: defaultUser.email,
          role: defaultUser.role,
          department_id: defaultUser.departmentId,
          status: "Active",
        }, {
          onConflict: "id"
        });

      if (profileError) {
        console.error(`❌ Failed to upsert public.profiles record for ${defaultUser.email}:`, profileError.message);
        profileStatus = `Profile upsert failed: ${profileError.message}`;
        results.push({ email: defaultUser.email, success: false, action: actionTaken, profileStatus });
      } else {
        profileStatus = "Profile upserted successfully";
        results.push({ email: defaultUser.email, success: true, action: actionTaken, profileStatus, userId: authUserId });
        console.log(`🎉 Successfully synced profile record for ${defaultUser.fullName} (Role: ${defaultUser.role})!`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Seeding completed", results }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("❌ Exception during Edge Function execution:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
