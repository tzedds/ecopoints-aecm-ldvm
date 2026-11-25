import { Request, Response } from "express";
import { pool } from "../db/pool";

export async function getRanking(_req: Request, res: Response) {
  // LEFT JOIN: los participantes sin puntos también aparecen, con 0
  // RANK: los empates comparten posición
  const result = await pool.query(
    `SELECT RANK() OVER (ORDER BY COALESCE(SUM(pl.points), 0) DESC)::int AS position,
            u.id AS user_id,
            u.name,
            COALESCE(SUM(pl.points), 0)::int AS total_points
       FROM users u
       LEFT JOIN point_logs pl ON pl.user_id = u.id
      WHERE u.role = 'participant'
      GROUP BY u.id, u.name
      ORDER BY total_points DESC, u.name ASC, u.id ASC`
  );
  res.json(result.rows);
}