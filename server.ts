import dotenv from "dotenv";
import app from "./api/app.ts";

// Load environment variables for local development
dotenv.config();

function validateEnvOnStartup() {
  console.log("🔍 [Supabase Auth Security] Validating environment variables on startup...");
  const missing = [];
  if (!process.env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!process.env.SUPABASE_ANON_KEY) missing.push("SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    console.error(`❌ ERROR: The following required environment variables are missing: ${missing.join(", ")}`);
    console.error("⚠️ Ensure these variables are populated in your .env file.");
  } else {
    console.log("✅ Required Supabase environment variables are detected!");
  }
}

if (!process.env.VERCEL) {
  validateEnvOnStartup();
  
  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Local dev server running on http://localhost:${PORT}`);
  });
}
