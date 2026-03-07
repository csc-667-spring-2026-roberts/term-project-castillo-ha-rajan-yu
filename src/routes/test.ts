import { Router } from "express";
import db from "../db/connection.js";

const router = Router();

router.get("/:id", async (_req, res) => {
  const { id } = _req.params;

  await db.none("Insert INTO test_table (message) VALUES ($1)", [
    `requested id: ${id} at ${new Date().toISOString()}`,
  ]);

  res.json(await db.any("SELECT * FROM test_table"));
});

export default router;
