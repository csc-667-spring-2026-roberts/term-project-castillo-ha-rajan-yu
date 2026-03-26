// Import core dependencies and route/middleware modules used by the server.
import express from "express";
import path from "path";

import session from "express-session"; //core sessions system to create and store session data
import connectPgSimple from "connect-pg-simple"; //connects sessions to postgres so sessions survive restart
import { Pool } from "pg"; //postgres connection pool

import homeRouter from "./routes/home.js";
import { requestLogger } from "./middleware/logging.js";
import { fileURLToPath } from "url";
import testRoutes from "./routes/test.js";

// Recreate __filename and __dirname for ES modules.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the Express application instance.
const app = express();
// Read the port from environment variables, defaulting to 3000.
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

//grab values from .env
const connectionString = process.env.DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;

//check them so app doesn't run broken
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

if (!sessionSecret) {
  throw new Error("SESSION_SECRET is not set");
}

// create a pool of resuable connections to postgres for sessions storage
// basically to manage connections to database
const pgPool = new Pool({
  connectionString,
});

// create session store that saves session data in postgres
const PgStore = connectPgSimple(session);

// Parse incoming JSON request bodies.
app.use(express.json());
// Parse URL-encoded form submissions.
app.use(express.urlencoded({ extended: true }));

// session middleware
app.use(
  session({
    //use postgres to store sessions and pool to talk to DB
    store: new PgStore({
      pool: pgPool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }), //saves sessions in table and autocreates table if needed

    secret: sessionSecret, //prevents users from tampering with session data
    resave: false, //avoids saving session if nothing changed
    saveUninitialized: false, //only create session when needed aka after login

    //configure session cookie security settings
    cookie: {
      httpOnly: true,
      sameSite: "lax", //helps prevent CSRF attacks
      secure: false,
    },
  }),
);

// Register application routes.
app.use("/", homeRouter);
app.use("/test", testRoutes);

// Serve static assets from the public directory.
app.use(express.static(path.join(__dirname, "..", "public")));

// Log details for each incoming request.
app.use(requestLogger);

// Start the server and print the local URL once it is listening.
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${String(PORT)}`);
});
