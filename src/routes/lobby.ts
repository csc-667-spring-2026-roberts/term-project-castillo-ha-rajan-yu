import { Router, type Request, type Response } from "express";

import * as games from "../db/games.js";
import { requireAuth } from "../middleware/auth.js";

const lobbyRouter = Router();

function isAdminEmail(email: string): boolean {
  const single = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return email.toLowerCase() === single || list.includes(email.toLowerCase());
}

lobbyRouter.get("/lobby", requireAuth, (request: Request, response: Response) => {
  const sessionUser = request.session.user;

  response.render("lobby", {
    title: "Lobby",
    user: sessionUser,
    isAdmin: sessionUser ? isAdminEmail(sessionUser.email) : false,
    error: undefined,
  });
});

lobbyRouter.get("/api/games", requireAuth, async (_request: Request, response: Response) => {
  const rows = await games.listGames();
  response.status(200).json({ games: rows });
});

lobbyRouter.post(
  "/api/games/:gameId/join",
  requireAuth,
  async (request: Request, response: Response) => {
    const sessionUser = request.session.user;
    const gameId = Number(request.params.gameId);

    if (!sessionUser) {
      response.status(401).json({ error: "Not authenticated." });
      return;
    }

    if (!Number.isFinite(gameId) || gameId <= 0) {
      response.status(400).json({ error: "Invalid game id." });
      return;
    }

    const joined = await games.joinGame(sessionUser.id, gameId);

    if (!joined) {
      response.status(404).json({ error: "Game not found." });
      return;
    }

    response.status(200).json({ message: "Joined game.", gameId });
  },
);

lobbyRouter.get("/games/:gameId", requireAuth, async (request: Request, response: Response) => {
  const gameId = Number(request.params.gameId);
  const sessionUser = request.session.user;

  if (!sessionUser || !Number.isFinite(gameId) || gameId <= 0) {
    response.status(404).send("Game not found.");
    return;
  }

  const canAccess = await games.userCanAccessGame(sessionUser.id, gameId);

  if (!canAccess) {
    response.status(403).send("You are not a player in this game.");
    return;
  }

  response.render("game", {
    title: `Game #${String(gameId)}`,
    user: sessionUser,
    gameId,
  });
});

lobbyRouter.post("/api/games", requireAuth, async (request: Request, response: Response) => {
  const sessionUser = request.session.user;
  if (!sessionUser) {
    response.status(401).json({ error: "Not authenticated." });
    return;
  }

  const created = await games.createGame(sessionUser.id);
  response.status(201).json({ game: created });
});

lobbyRouter.delete(
  "/api/games/:gameId",
  requireAuth,
  async (request: Request, response: Response) => {
    const sessionUser = request.session.user;
    const gameId = Number(request.params.gameId);

    if (!sessionUser) {
      response.status(401).json({ error: "Not authenticated." });
      return;
    }

    if (!Number.isFinite(gameId) || gameId <= 0) {
      response.status(400).json({ error: "Invalid game id." });
      return;
    }

    const deleted = isAdminEmail(sessionUser.email)
      ? await games.deleteGameById(gameId)
      : await games.deleteGame(gameId, sessionUser.id);

    if (!deleted) {
      response
        .status(403)
        .json({ error: "Only the game creator or an admin can delete this game." });
      return;
    }

    response.status(200).json({ message: "Game deleted.", gameId });
  },
);

export default lobbyRouter;
