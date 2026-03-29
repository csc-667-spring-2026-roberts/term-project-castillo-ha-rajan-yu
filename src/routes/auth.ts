import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";

import db from "../db/connection.js";
import { requireAuth, requireGuest } from "../middleware/auth.js";

interface AuthViewData {
  title: string;
  error?: string;
  formData?: {
    username?: string;
    email?: string;
  };
}

interface RegisterRequestBody {
  username: string;
  email: string;
  password: string;
}

interface LoginRequestBody {
  email: string;
  password: string;
}

const router = Router();

// Prevent repeated CREATE TABLE checks after first successful ensure.
let usersTableReady = false;

async function ensureUsersTable(): Promise<void> {
  if (usersTableReady) {
    return;
  }

  // Lightweight bootstrap to support auth flow even before DB migrations are in place.
  await db.none(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  usersTableReady = true;
}

function renderRegisterPage(res: Response, data?: AuthViewData): void {
  // Render helper centralizes view props and keeps handlers concise.
  res.render("auth/register", {
    title: data?.title ?? "Register",
    error: data?.error,
    formData: data?.formData,
  });
}

function renderLoginPage(res: Response, data?: AuthViewData): void {
  // Render helper centralizes view props and keeps handlers concise.
  res.render("auth/login", {
    title: data?.title ?? "Login",
    error: data?.error,
    formData: data?.formData,
  });
}

router.get("/auth/register", requireGuest, async (_req, res) => {
  await ensureUsersTable();
  renderRegisterPage(res);
});

router.post(
  "/auth/register",
  requireGuest,
  async (req: Request<Record<string, never>, unknown, Partial<RegisterRequestBody>>, res) => {
    await ensureUsersTable();

    const username = (req.body.username ?? "").trim();
    const email = (req.body.email ?? "").trim().toLowerCase();
    const password = req.body.password ?? "";

    // Basic server-side validation for required registration inputs.
    if (!username || !email || !password) {
      renderRegisterPage(res.status(400), {
        title: "Register",
        error: "All fields are required.",
        formData: { username, email },
      });
      return;
    }

    if (password.length < 8) {
      renderRegisterPage(res.status(400), {
        title: "Register",
        error: "Password must be at least 8 characters.",
        formData: { username, email },
      });
      return;
    }

    // Prevent duplicate usernames/emails from being registered.
    const existingUser = await db.oneOrNone<{ id: number }>(
      "SELECT id FROM users WHERE username = $1 OR email = $2",
      [username, email],
    );

    if (existingUser) {
      renderRegisterPage(res.status(409), {
        title: "Register",
        error: "Username or email is already in use.",
        formData: { username, email },
      });
      return;
    }

    // Hash password before persisting credentials.
    const passwordHash = await bcrypt.hash(password, 10);

    const createdUser = await db.one<{ id: number; username: string; email: string }>(
      `
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, username, email
      `,
      [username, email, passwordHash],
    );

    // Persist the authenticated user identity in session after registration.
    req.session.user = {
      id: createdUser.id,
      username: createdUser.username,
      email: createdUser.email,
    };

    // PRG pattern: redirect after successful form submission.
    res.redirect("/lobby");
  },
);

router.get("/auth/login", requireGuest, async (_req, res) => {
  await ensureUsersTable();
  renderLoginPage(res);
});

router.post(
  "/auth/login",
  requireGuest,
  async (req: Request<Record<string, never>, unknown, Partial<LoginRequestBody>>, res) => {
    await ensureUsersTable();

    const email = (req.body.email ?? "").trim().toLowerCase();
    const password = req.body.password ?? "";

    // Validate required login credentials.
    if (!email || !password) {
      renderLoginPage(res.status(400), {
        title: "Login",
        error: "Email and password are required.",
        formData: { email },
      });
      return;
    }

    // Retrieve login candidate by email.
    const user = await db.oneOrNone<{
      id: number;
      username: string;
      email: string;
      password_hash: string;
    }>("SELECT id, username, email, password_hash FROM users WHERE email = $1", [email]);

    if (!user) {
      renderLoginPage(res.status(401), {
        title: "Login",
        error: "Invalid email or password.",
        formData: { email },
      });
      return;
    }

    // Compare plaintext input to stored password hash.
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      renderLoginPage(res.status(401), {
        title: "Login",
        error: "Invalid email or password.",
        formData: { email },
      });
      return;
    }

    // Store authenticated user identity in session on successful login.
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    // PRG pattern: redirect after successful form submission.
    res.redirect("/lobby");
  },
);

router.post("/auth/logout", requireAuth, (req, res) => {
  // Destroying the session logs the user out server-side.
  req.session.destroy((error: Error | null) => {
    if (error) {
      res.redirect("/lobby");
      return;
    }

    // Return guest users to login after logout.
    res.redirect("/auth/login");
  });
});

// Authenticated landing page; protected by `requireAuth` middleware.
router.get("/lobby", requireAuth, (req, res) => {
  res.render("auth/lobby", {
    title: "Lobby",
    user: req.session.user,
  });
});

export default router;
