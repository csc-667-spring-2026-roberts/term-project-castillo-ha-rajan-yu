import { Router, type Request, type Response } from "express";
import db from "../db/connection.js";

const router = Router();

interface TestPostBody {
  message?: string;
}

// M5: test route uses pg-promise to read/write DB in both GET and POST handlers.
async function ensureTestTable(): Promise<void> {
  await db.none(`
    CREATE TABLE IF NOT EXISTS test_table (
      id SERIAL PRIMARY KEY,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

router.get("/:id", async (_req, res) => {
  const { id } = _req.params;

  await ensureTestTable();

  await db.none("Insert INTO test_table (message) VALUES ($1)", [
    `requested id: ${id} at ${new Date().toISOString()}`,
  ]);

  res.json(await db.any("SELECT * FROM test_table"));
});

router.post(
  "/",
  async (req: Request<Record<string, never>, unknown, TestPostBody>, res: Response) => {
    await ensureTestTable();

    const bodyMessage = req.body.message;
    const message =
      typeof bodyMessage === "string" && bodyMessage.trim()
        ? bodyMessage.trim()
        : `posted at ${new Date().toISOString()}`;

    await db.none("INSERT INTO test_table (message) VALUES ($1)", [message]);
    res.status(201).json(await db.any("SELECT * FROM test_table ORDER BY id DESC LIMIT 10"));
  },
);

export default router;
