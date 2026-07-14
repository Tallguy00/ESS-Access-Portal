import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// Initialize backend Supabase client using environment variables or hardcoded fallbacks
const supabaseUrl = process.env.SUPABASE_URL || "https://kbqlhumzcfenjumhaznf.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "sb_publishable_VKLTCPIGXD6R64_jf3XW3Q_iIY6dK5e";
const supabaseBackend = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware with reasonable limit for base64 file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV });
  });

  // --- AUTHENTICATION PROXY ENDPOINTS ---

  app.post("/api/auth/session", async (req, res) => {
    const { session } = req.body;
    res.json({ data: { session }, error: null });
  });

  app.post("/api/auth/user", async (req, res) => {
    const { session } = req.body;
    if (!session?.access_token) {
      return res.json({ data: { user: null }, error: null });
    }
    const { data, error } = await supabaseBackend.auth.getUser(session.access_token);
    res.json({ data, error: error ? { message: error.message } : null });
  });

  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, options } = req.body;
    const { data, error } = await supabaseBackend.auth.signUp({ email, password, options });
    res.json({ data, error: error ? { message: error.message } : null });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabaseBackend.auth.signInWithPassword({ email, password });
    res.json({ data, error: error ? { message: error.message } : null });
  });

  app.post("/api/auth/login-otp", async (req, res) => {
    const { email, options } = req.body;
    const { data, error } = await supabaseBackend.auth.signInWithOtp({ email, options });
    res.json({ data, error: error ? { message: error.message } : null });
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    const { email, token, type } = req.body;
    const { data, error } = await supabaseBackend.auth.verifyOtp({ email, token, type });
    res.json({ data, error: error ? { message: error.message } : null });
  });

  app.post("/api/auth/logout", async (req, res) => {
    const { error } = await supabaseBackend.auth.signOut();
    res.json({ success: !error, error: error ? { message: error.message } : null });
  });

  app.post("/api/auth/update-user", async (req, res) => {
    const { data: userData } = req.body;
    const { data, error } = await supabaseBackend.auth.updateUser(userData);
    res.json({ data, error: error ? { message: error.message } : null });
  });

  // --- DATABASE QUERY PROXY ENDPOINT ---

  app.post("/api/db/query", async (req, res) => {
    const { table, chain } = req.body;
    try {
      let query: any = supabaseBackend.from(table);
      for (const step of chain) {
        const { method, args } = step;
        if (typeof query[method] === 'function') {
          query = query[method](...args);
        }
      }
      const result = await query;
      res.json({ data: result.data, error: result.error ? { message: result.error.message } : null });
    } catch (err: any) {
      console.error(`Database query failed on table "${table}":`, err);
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
      res.status(500).json({ error: { message: err.message || "File deletion failed" } });
    }
  });

  // --- VITE DEV / PRODUCTION ROUTING ---

  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
