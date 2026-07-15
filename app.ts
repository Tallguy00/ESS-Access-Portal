import express from "express";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Validation helper for environment variables
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

async function getClientForSession(session: any): Promise<{ client: any; refreshedSession: any }> {
  if (!session?.access_token) {
    return { client: getSupabaseBackend(), refreshedSession: null };
  }

  let activeSession = session;
  let didRefresh = false;

  try {
    const payloadBase64 = session.access_token.split('.')[1];
    if (payloadBase64) {
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
      const exp = payload.exp;
      const now = Math.floor(Date.now() / 1000);

      // If expired or within 60 seconds of expiring, refresh it
      if (exp && exp - now < 60 && session.refresh_token) {
        console.log("JWT expired or near expiration. Refreshing session...");
        const { data, error } = await getSupabaseBackend().auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });

        if (!error && data.session) {
          console.log("Successfully refreshed session!");
          activeSession = data.session;
          didRefresh = true;
        } else {
          console.error("Failed to refresh session on check:", error);
        }
      }
    }
  } catch (err) {
    console.warn("Error decoding/refreshing token:", err);
  }

  const client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: {
      headers: {
        Authorization: `Bearer ${activeSession.access_token}`,
      },
    },
  });

  return { client, refreshedSession: didRefresh ? activeSession : null };
}

const app = express();

// Use JSON middleware with reasonable limit for base64 file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Dynamic CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Regular /api routes check (Only requires SUPABASE_URL and SUPABASE_ANON_KEY)
app.use("/api", (req, res, next) => {
  if (req.path === "/health") {
    return next();
  }
  const missing = [];
  if (!process.env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!process.env.SUPABASE_ANON_KEY) missing.push("SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    console.error(`❌ Regular API Error: Missing environment variables: ${missing.join(", ")}`);
    return res.status(500).json({
      error: {
        message: `Configuration error: The following required Supabase environment variables are missing on the server: ${missing.join(", ")}. Please set them in your environment configurations.`
      }
    });
  }
  next();
});

// Admin /api/admin routes check (Requires SUPABASE_SERVICE_ROLE_KEY additionally)
app.use("/api/admin", (req, res, next) => {
  const missing = [];
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length > 0) {
    console.error(`❌ Admin API Error: Missing Service Role Key: ${missing.join(", ")}`);
    return res.status(500).json({
      error: {
        message: `Configuration error: The following required admin environment variables are missing on the server: ${missing.join(", ")}. Please set them in your environment configurations.`
      }
    });
  }
  next();
});

// API Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
});

// --- AUTHENTICATION PROXY ENDPOINTS ---

app.post("/api/auth/session", async (req, res) => {
  try {
    let { session } = req.body || {};
    let refreshedSession: any = null;
    if (session?.access_token && session?.refresh_token) {
      try {
        const payloadBase64 = session.access_token.split('.')[1];
        if (payloadBase64) {
          const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
          const exp = payload.exp;
          const now = Math.floor(Date.now() / 1000);
          if (exp && exp - now < 60) {
            console.log("getSession session token expired or close. Refreshing...");
            const { data, error } = await supabaseBackend.auth.setSession({
              access_token: session.access_token,
              refresh_token: session.refresh_token
            });
            if (!error && data.session) {
              session = data.session;
              refreshedSession = data.session;
            }
          }
        }
      } catch (err) {
        console.warn("getSession JWT check failed:", err);
      }
    }
    res.json({ data: { session }, error: null, refreshedSession });
  } catch (err: any) {
    console.error("Session check API failed:", err);
    res.status(500).json({ error: { message: err.message || "Session check failed" } });
  }
});

app.post("/api/auth/user", async (req, res) => {
  try {
    let { session } = req.body || {};
    if (!session?.access_token) {
      return res.json({ data: { user: null }, error: null });
    }
    let { data, error } = await supabaseBackend.auth.getUser(session.access_token);
    let refreshedSession: any = null;

    if (error && session.refresh_token && (error.message?.toLowerCase().includes("jwt") || error.message?.toLowerCase().includes("expired"))) {
      console.log("getUser failed with JWT error. Attempting session refresh...");
      const refreshResult = await supabaseBackend.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
      if (!refreshResult.error && refreshResult.data.session) {
        console.log("getUser session refresh succeeded!");
        session = refreshResult.data.session;
        refreshedSession = refreshResult.data.session;
        const retryUser = await supabaseBackend.auth.getUser(session.access_token);
        data = retryUser.data;
        error = retryUser.error;
      }
    }

    res.json({ data, error: error ? { message: error.message } : null, refreshedSession });
  } catch (err: any) {
    console.error("User fetch API failed:", err);
    res.status(500).json({ error: { message: err.message || "User fetch failed" } });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, options } = req.body || {};
    const { data, error } = await supabaseBackend.auth.signUp({ email, password, options });
    res.json({ data, error: error ? { message: error.message } : null });
  } catch (err: any) {
    console.error("Signup API failed:", err);
    res.status(500).json({ error: { message: err.message || "Signup failed" } });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const { data, error } = await supabaseBackend.auth.signInWithPassword({ email, password });
    res.json({ data, error: error ? { message: error.message } : null });
  } catch (err: any) {
    console.error("Login API failed:", err);
    res.status(500).json({ error: { message: err.message || "Login failed" } });
  }
});

app.post("/api/auth/login-otp", async (req, res) => {
  try {
    const { email, options } = req.body || {};
    const { data, error } = await supabaseBackend.auth.signInWithOtp({ email, options });
    res.json({ data, error: error ? { message: error.message } : null });
  } catch (err: any) {
    console.error("OTP login API failed:", err);
    res.status(500).json({ error: { message: err.message || "OTP login failed" } });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, token, type } = req.body || {};
    const { data, error } = await supabaseBackend.auth.verifyOtp({ email, token, type });
    res.json({ data, error: error ? { message: error.message } : null });
  } catch (err: any) {
    console.error("OTP verify API failed:", err);
    res.status(500).json({ error: { message: err.message || "OTP verification failed" } });
  }
});

app.post("/api/auth/oauth-url", async (req, res) => {
  try {
    const { provider, options } = req.body || {};
    const { data, error } = await supabaseBackend.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: options?.redirectTo,
        queryParams: options?.queryParams,
        scopes: options?.scopes
      }
    });
    res.json({ data, error: error ? { message: error.message } : null });
  } catch (err: any) {
    console.error("OAuth URL generation API failed:", err);
    res.status(500).json({ error: { message: err.message || "OAuth URL generation failed" } });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    const { error } = await supabaseBackend.auth.signOut();
    res.json({ success: !error, error: error ? { message: error.message } : null });
  } catch (err: any) {
    console.error("Logout API failed:", err);
    res.status(500).json({ success: false, error: { message: err.message || "Logout failed" } });
  }
});

app.post("/api/auth/update-user", async (req, res) => {
  try {
    const { data: userData } = req.body || {};
    const { data, error } = await supabaseBackend.auth.updateUser(userData);
    res.json({ data, error: error ? { message: error.message } : null });
  } catch (err: any) {
    console.error("Update user API failed:", err);
    res.status(500).json({ error: { message: err.message || "Update user failed" } });
  }
});

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
    console.error("Admin user list API failed:", err);
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
    console.error("Admin user create API failed:", err);
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
    console.error("Admin user update API failed:", err);
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
    console.error("Admin user delete API failed:", err);
    res.status(500).json({ error: { message: err.message || "Admin user deletion failed" } });
  }
});

// --- DATABASE QUERY PROXY ENDPOINT ---

app.post("/api/db/query", async (req, res) => {
  try {
    const { table, chain, session } = req.body || {};
    if (!table) {
      return res.status(400).json({ error: { message: "Table name is required" } });
    }
    const { client, refreshedSession } = await getClientForSession(session);
    let query: any = client.from(table);
    for (const step of chain || []) {
      const { method, args } = step;
      if (typeof query[method] === 'function') {
        query = query[method](...args);
      }
    }
    let result = await query;

    // Check if result has expired JWT error, and try force-refreshing if we haven't already refreshed
    if (!refreshedSession && session?.refresh_token && (result.error?.message?.toLowerCase().includes("jwt") || result.error?.message?.toLowerCase().includes("expired") || result.error?.status === 401)) {
      console.log("Query returned JWT error. Attempting forced session refresh...");
      const { data, error } = await getSupabaseBackend().auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
      if (!error && data.session) {
        console.log("Forced refresh succeeded! Retrying query with new session...");
        const retryClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
          global: {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
            },
          },
        });
        let retryQuery: any = retryClient.from(table);
        for (const step of chain || []) {
          const { method, args } = step;
          if (typeof retryQuery[method] === 'function') {
            retryQuery = retryQuery[method](...args);
          }
        }
        result = await retryQuery;
        return res.json({
          data: result.data,
          error: result.error ? { message: result.error.message } : null,
          refreshedSession: data.session
        });
      }
    }

    res.json({
      data: result.data,
      error: result.error ? { message: result.error.message } : null,
      refreshedSession
    });
  } catch (err: any) {
    console.error(`Database query failed on table "${req.body?.table}":`, err);
    res.status(500).json({ error: { message: err.message || "Database query failed" } });
  }
});

// --- STORAGE PROXY ENDPOINTS ---

app.post("/api/storage/upload", async (req, res) => {
  const { bucket, path: filePath, fileBase64, contentType, options } = req.body;
  try {
    const buffer = Buffer.from(fileBase64, "base64");
    const { data, error } = await supabaseBackend.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType,
        ...options,
        upsert: true
      });
    res.json({ data, error: error ? { message: error.message } : null });
  } catch (err: any) {
    console.error("Storage upload API failed:", err);
    res.status(500).json({ error: { message: err.message || "File upload failed" } });
  }
});

app.post("/api/storage/delete", async (req, res) => {
  const { bucket, paths } = req.body;
  try {
    const { data, error } = await supabaseBackend.storage
      .from(bucket)
      .remove(paths);
    res.json({ data, error: error ? { message: error.message } : null });
  } catch (err: any) {
    console.error("Storage delete API failed:", err);
    res.status(500).json({ error: { message: err.message || "File deletion failed" } });
  }
});

// --- OAUTH CALLBACK ROUTE ---
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.send(`
      <html>
        <body>
          <script>
            const hash = window.location.hash;
            if (hash && hash.includes("access_token=")) {
              const params = new URLSearchParams(hash.replace("#", "?"));
              const session = {
                access_token: params.get("access_token"),
                refresh_token: params.get("refresh_token"),
                expires_in: parseInt(params.get("expires_in") || "3600"),
                token_type: params.get("token_type") || "bearer",
                user: null
              };
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', session }, '*');
                window.close();
              } else {
                localStorage.setItem("ar_active_session", JSON.stringify(session));
                window.location.href = '/';
              }
            } else {
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'No authorization code or token found' }, '*');
                window.close();
              } else {
                document.write("Authentication failed: No token found");
              }
            }
          </script>
          <p>Processing authentication...</p>
        </body>
      </html>
    `);
  }

  try {
    const { data, error } = await supabaseBackend.auth.exchangeCodeForSession(String(code));
    if (error) {
      throw error;
    }
    
    const sessionStr = JSON.stringify(data.session);
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', session: ${sessionStr} }, '*');
              window.close();
            } else {
              localStorage.setItem("ar_active_session", ${JSON.stringify(sessionStr)});
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. You can close this window.</p>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("Code exchange failed:", err);
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(err.message || "Code exchange failed")} }, '*');
              window.close();
            } else {
              document.write("Authentication failed: " + ${JSON.stringify(err.message)});
            }
          </script>
          <p>Authentication failed: ${err.message}</p>
        </body>
      </html>
    `);
  }
});

// --- VITE DEV / PRODUCTION ROUTING (Only runs locally if !process.env.VERCEL) ---
async function initializeRouting() {
  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }
}

initializeRouting();

export default app;
