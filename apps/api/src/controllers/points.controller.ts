import { Request, Response } from "express";
import { pool } from "../db/pool";
import { AuthPayload } from "../auth/jwt";

// Puntos acumulados y movimientos del usuario autenticado
export async function getMyPoints(_req: Request, res: Response) {
  const auth = res.locals.auth as AuthPayload;

  const [total, movements] = await Promise.all([
    // El total sale de la suma de lo guardado en la base, nunca de un contador aparte
    pool.query(
      "SELECT COALESCE(SUM(points), 0)::int AS total FROM point_logs WHERE user_id = $1",
      [auth.id]
    ),
    pool.query(
      `SELECT pl.id, pl.entry_id, pl.points, m.name AS material_name, m.unit,
              e.quantity, pl.created_at
         FROM point_logs pl
         JOIN recycling_entries e ON e.id = pl.entry_id
         JOIN materials m ON m.id = e.material_id
        WHERE pl.user_id = $1
        ORDER BY pl.created_at DESC, pl.id DESC`,
      [auth.id]
    ),
  ]);

  res.json({ total: total.rows[0].total, movements: movements.rows });
}