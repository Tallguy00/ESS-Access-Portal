import dotenv from "dotenv";
import app from "./app";
import logger from "./logger";

// Load environment variables for local development
dotenv.config();

function validateEnvOnStartup() {
  logger.info("🔍 [Supabase Auth Security] Validating environment variables on startup...");
  const missing = [];
  if (!process.env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!process.env.SUPABASE_ANON_KEY) missing.push("SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    logger.error(`❌ ERROR: The following required environment variables are missing: ${missing.join(", ")}`);
    logger.error("⚠️ Ensure these variables are populated in your .env file.");
  } else {
    logger.info("✅ Required Supabase environment variables are detected!");
  }
}

validateEnvOnStartup();

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, "0.0.0.0", () => {
  logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
