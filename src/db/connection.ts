import pgp from "pg-promise";
import dotenv from "dotenv";

dotenv.config();

const connectionSting = process.env.DATABASE_URL;

const db = pgp()(connectionSting);

export default db;
