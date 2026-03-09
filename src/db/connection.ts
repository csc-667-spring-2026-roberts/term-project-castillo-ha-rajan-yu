import pgp from "pg-promise";
import dotenv from "dotenv";

// Load environment variables from .env into process.env.
dotenv.config();

const connectionString = process.env.DATABASE_URL;

// Fail fast on startup if DB config is missing.
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Create a shared pg-promise database instance for the app.
const db = pgp()(connectionString);

export default db;
