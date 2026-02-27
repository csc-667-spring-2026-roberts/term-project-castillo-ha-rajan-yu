import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).send("<h1>It works!</h1>");
});

export default router;
