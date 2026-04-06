import pgp from "pg-promise";
import dotenv from "dotenv";

// M5: DATABASE_URL is loaded from .env for pg-promise connectivity.
// Load environment variables from .env into process.env.
dotenv.config();

const connectionString = process.env.DATABASE_URL;

// Fail fast on startup if DB config is missing.
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Create a shared pg-promise database instance for the app.
// M5: pg-promise connection used by all DB routes/modules.
const db = pgp()(connectionString);

export default db;
