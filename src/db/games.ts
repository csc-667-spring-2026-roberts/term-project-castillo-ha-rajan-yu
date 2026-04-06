import db from "./connection.js";
import type { Game, GameListItem } from "../types/types.js";

export async function createGame(userId: number): Promise<Game> {
  return db.tx(async (t) => {
    const game = await t.one<Game>(
      `
        INSERT INTO games DEFAULT VALUES
        RETURNING id, status, created_at
      `,
    );

    await t.none(
      `
        INSERT INTO game_users (game_id, user_id)
        VALUES ($1, $2)
      `,
      [game.id, userId],
    );

    return game;
  });
}

export async function listGames(): Promise<GameListItem[]> {
  return db.manyOrNone<GameListItem>(
    `
      SELECT
        g.id,
        g.status,
        g.created_at,
        u.email AS creator_email,
        COUNT(gu_all.user_id)::int AS player_count
      FROM games g
      INNER JOIN (
        SELECT DISTINCT ON (game_id) game_id, user_id
        FROM game_users
        ORDER BY game_id, joined_at ASC
      ) gu_first ON gu_first.game_id = g.id
      INNER JOIN users u ON u.id = gu_first.user_id
      INNER JOIN game_users gu_all ON gu_all.game_id = g.id
      GROUP BY g.id, g.status, g.created_at, u.email
      ORDER BY g.created_at DESC
    `,
  );
}

export async function userCanAccessGame(userId: number, gameId: number): Promise<boolean> {
  const row = await db.oneOrNone<{ game_id: number }>(
    `
      SELECT gu.game_id
      FROM game_users gu
      WHERE gu.game_id = $1 AND gu.user_id = $2
      LIMIT 1
    `,
    [gameId, userId],
  );

  return row !== null;
}

export async function joinGame(userId: number, gameId: number): Promise<boolean> {
  const game = await db.oneOrNone<{ id: number }>(
    `
      SELECT id
      FROM games
      WHERE id = $1
      LIMIT 1
    `,
    [gameId],
  );

  if (!game) {
    return false;
  }

  await db.none(
    `
      INSERT INTO game_users (game_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (game_id, user_id) DO NOTHING
    `,
    [gameId, userId],
  );

  return true;
}

export async function deleteGame(gameId: number, userId: number): Promise<boolean> {
  const deleted = await db.result(
    `
      DELETE FROM games g
      USING (
        SELECT DISTINCT ON (gu.game_id) gu.game_id, gu.user_id
        FROM game_users gu
        WHERE gu.game_id = $1
        ORDER BY gu.game_id, gu.joined_at ASC
      ) first_player
      WHERE g.id = first_player.game_id
        AND g.id = $1
        AND first_player.user_id = $2
    `,
    [gameId, userId],
  );

  return deleted.rowCount > 0;
}

export async function deleteGameById(gameId: number): Promise<boolean> {
  const deleted = await db.result(
    `
      DELETE FROM games
      WHERE id = $1
    `,
    [gameId],
  );

  return deleted.rowCount > 0;
}
