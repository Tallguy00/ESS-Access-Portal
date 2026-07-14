import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// Validate required environment variables on startup
function validateEnvOnStartup() {
  console.log("🔍 [Supabase Auth Security] Validating environment variables on startup...");
  const missing = [];
  if (!process.env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!process.env.SUPABASE_ANON_KEY) missing.push("SUPABASE_ANON_KEY");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length > 0) {
    console.error(`❌ ERROR: The following required environment variables are missing: ${missing.join(", ")}`);
    console.error("⚠️ Ensure these variables are populated in your .env file or production environment secrets.");
  } else {
    console.log("✅ All required Supabase environment variables are detected!");
  }
}
validateEnvOnStartup();

function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL;
  if (!url) {
    throw new Error("SUPABASE_URL environment variable is missing. Please set it in your environment configurations.");
  }
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error("SUPABASE_ANON_KEY environment variable is missing. Please set it in your environment configurations.");
  }
  return key;
}

function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is missing. Please set it in your environment configurations.");
  }
  return key;
}

// Lazy-loaded Supabase clients
let supabaseBackendInstance: any = null;
let supabaseAdminInstance: any = null;

function getSupabaseBackend() {
  if (!supabaseBackendInstance) {
    supabaseBackendInstance = createClient(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return supabaseBackendInstance;
}

function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseAdminInstance;
}

// Transparent Proxy wrapper to act as 'supabaseBackend' to prevent editing complex endpoints
const supabaseBackend = {
  get auth() {
    return getSupabaseBackend().auth;
  },
  get storage() {
    return getSupabaseBackend().storage;
  },
  from(table: string) {
    return getSupabaseBackend().from(table);
  }
};

// ... [Existing jwt verification, query retry, and health check endpoints] ...

  // --- ADMIN AUTH PROXY ENDPOINTS (using Service Role Key) ---

  app.get("/api/admin/users", async (req, res) => {
    try {
      const adminClient = getSupabaseAdmin();
      const { data, error } = await adminClient.auth.admin.listUsers();
      if (error) {
        return res.status(error.status || 500).json({ error: { message: error.message } });
      }
      res.json({ data, error: null });
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message || "Admin user list retrieval failed" } });
    }
  });

  app.post("/api/admin/users/create", async (req, res) => {
    try {
      const { email, password, email_confirm, user_metadata } = req.body || {};
      const adminClient = getSupabaseAdmin();
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: email_confirm ?? true,
        user_metadata
      });
      if (error) {
        return res.status(error.status || 500).json({ error: { message: error.message } });
      }
      res.json({ data, error: null });
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message || "Admin user creation failed" } });
    }
  });

  app.post("/api/admin/users/update", async (req, res) => {
    try {
      const { id, password, email_confirm, user_metadata } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: { message: "User ID is required" } });
      }
      const adminClient = getSupabaseAdmin();
      const { data, error } = await adminClient.auth.admin.updateUserById(id, {
        password,
        email_confirm,
        user_metadata
      });
      if (error) {
        return res.status(error.status || 500).json({ error: { message: error.message } });
      }
      res.json({ data, error: null });
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message || "Admin user update failed" } });
    }
  });

  app.post("/api/admin/users/delete", async (req, res) => {
    try {
      const { id } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: { message: "User ID is required" } });
      }
      const adminClient = getSupabaseAdmin();
      const { data, error } = await adminClient.auth.admin.deleteUser(id);
      if (error) {
        return res.status(error.status || 500).json({ error: { message: error.message } });
      }
      res.json({ data, error: null });
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message || "Admin user deletion failed" } });
    }
  });