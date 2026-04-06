import { fileURLToPath } from "url";
import path from "path";

import connectLivereload from "connect-livereload";
import connectPgSimple from "connect-pg-simple";
// M4: Express installed and configured as the primary web framework.
import express from "express";
import livereload from "livereload";
import { Pool } from "pg";
import session from "express-session";

import { authRouter } from "./routes/auth.js";
import homeRouter from "./routes/home.js";
import lobbyRouter from "./routes/lobby.js";
import { requestLogger } from "./middleware/logging.js";
import testRoutes from "./routes/test.js";

// Recreate __filename and __dirname for ES modules.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the Express application instance.
const app = express();
// Read the port from environment variables, defaulting to 3000.
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const connectionString = process.env.DATABASE_URL;
const sessionSecret =
  process.env.SESSION_SECRET ??
  (process.env.NODE_ENV === "production" ? undefined : "dev-only-session-secret");

if (!connectionString) throw new Error("DATABASE_URL is not set");
if (!sessionSecret) throw new Error("SESSION_SECRET is not set");

if (!process.env.SESSION_SECRET && process.env.NODE_ENV !== "production") {
  console.warn("SESSION_SECRET is not set; using development fallback secret.");
}

const pgPool = new Pool({ connectionString });
const PgStore = connectPgSimple(session);

// Parse incoming JSON request bodies.
app.use(express.json());
// Parse URL-encoded form submissions.
app.use(express.urlencoded({ extended: true }));

// Configure server-side rendering with EJS templates.
// M7: EJS is configured as the Express view engine.
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

// M8: live reload setup for template/CSS/client-JS refresh during development.
if (process.env.NODE_ENV !== "production") {
  const liveReloadServer = livereload.createServer({
    exts: ["ejs", "css", "js"],
  });

  liveReloadServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code !== "EADDRINUSE") throw err;
    console.warn("Live reload unavailable: port 35729 already in use.");
  });

  liveReloadServer.watch([
    path.join(__dirname, "..", "views"),
    path.join(__dirname, "..", "public"),
  ]);

  app.use(connectLivereload());
}

// Log details for each incoming request.
app.use(requestLogger);

app.use(
  session({
    // M6: connect-pg-simple stores sessions in Postgres (survives restarts).
    store: new PgStore({
      pool: pgPool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    },
  }),
);

app.use("/", homeRouter);
app.use("/auth", authRouter);
app.use("/", lobbyRouter);
// M5: test DB route mounted for pg-promise read/write verification.
app.use("/test", testRoutes);

// M4: Static file serving is configured from /public.
app.use(express.static(path.join(__dirname, "..", "public")));

// Start the server and print the local URL once it is listening.
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${String(PORT)}`);
});
