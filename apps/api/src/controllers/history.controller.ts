import { Request, Response } from "express";
import { pool } from "../db/pool";
import { AuthPayload } from "../auth/jwt";
import { badRequest } from "../errors";

const VALID_STATUSES = ["pending", "approved", "rejected"];
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function parsePositiveInt(value: unknown, name: string, fallback: number): number {
  if (value === undefined) return fallback;
  const n = typeof value === "string" ? Number(value) : NaN;
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest(`${name} debe ser un número entero positivo`);
  }
  return n;
}

// Historial de entregas, el participante ve las suyas y el encargado ve todas
export async function listHistory(req: Request, res: Response) {
  const auth = res.locals.auth as AuthPayload;
  const isManager = auth.role === "manager";

  const status = req.query.status;
  if (status !== undefined && (typeof status !== "string" || !VALID_STATUSES.includes(status))) {
    throw badRequest("status debe ser pending, approved o rejected");
  }

  const page = parsePositiveInt(req.query.page, "page", 1);
  const limit = parsePositiveInt(req.query.limit, "limit", DEFAULT_LIMIT);
  if (limit > MAX_LIMIT) {
    throw badRequest(`limit no puede ser mayor a ${MAX_LIMIT}`);
  }
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (!isManager) {
    params.push(auth.id);
    conditions.push(`e.user_id = $${params.length}`);
  }
  if (status !== undefined) {
    params.push(status);
    conditions.push(`e.status = $${params.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM recycling_entries e ${where}`,
    params
  );
  const total: number = totalResult.rows[0].total;

  const result = await pool.query(
    `SELECT e.id, u.name AS user_name, m.name AS material_name, m.unit,
            e.quantity, e.status, p.points, e.created_at,
            v.name AS validated_by_name, e.validated_at
       FROM recycling_entries e
       JOIN users u ON u.id = e.user_id
       JOIN materials m ON m.id = e.material_id
       LEFT JOIN point_logs p ON p.entry_id = e.id
       LEFT JOIN users v ON v.id = e.validated_by
       ${where}
      ORDER BY e.created_at DESC, e.id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  // Solo el encargado ve quién validó
  const data = result.rows.map((row) => ({
    ...row,
    validated_by_name: isManager ? row.validated_by_name : null,
  }));

  res.json({ data, page, limit, total, total_pages: Math.ceil(total / limit) });
}