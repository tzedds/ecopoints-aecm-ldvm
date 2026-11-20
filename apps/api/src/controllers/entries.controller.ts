import { Request, Response } from "express";
import { pool } from "../db/pool";
import { AuthPayload} from "../auth/jwt";

const VALID_STATUSES = ["pending", "approved", "rejected"];

export async function createEntry(req: Request, res: Response) {
  // el usuario saldra del token y ya no del body
  const auth = res.locals.auth as AuthPayload;
  const { material_id, quantity } = req.body ?? {};

  // 1. Validar que sean enteros positivos
  if (
    !Number.isInteger(material_id) || material_id <= 0 ||
    !Number.isInteger(quantity) || quantity <= 0
  ) {
    res.status(400).json({
      error: "material_id y quantity deben ser números enteros positivos",
    });
    return;
  }

  try {
    // 2. El material debe existir y estar activo
    const material = await pool.query(
      "SELECT id FROM materials WHERE id = $1 AND active = TRUE",
      [material_id]
    );
    if (material.rowCount === 0) {
      res.status(404).json({ error: "Material no encontrado" });
      return;
    }

    // 3. El usuario debe existir
    const user = await pool.query("SELECT id FROM users WHERE id = $1", [auth.id]);
    if (user.rowCount === 0) {
      res.status(401).json({ error: "Usuario no encontrado" });
      return;
    }

    // 4. Guardar. El estado queda 'pending' por defecto en la base de datos
    const result = await pool.query(
      `INSERT INTO recycling_entries (user_id, material_id, quantity)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, material_id, quantity, status, created_at`,
      [auth.id, material_id, quantity]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al registrar la entrega:", error);
    res.status(500).json({ error: "No se pudo registrar la entrega" });
  }
}

// entregas del usuario autenticado
export async function listMyEntries(_req: Request, res: Response) {
  const auth = res.locals.auth as AuthPayload;
  try {
    const result = await pool.query(
      `SELECT e.id, m.name AS material_name, m.unit, e.quantity, e.status, e.created_at
         FROM recycling_entries e
         JOIN materials m ON m.id = e.material_id
        WHERE e.user_id = $1
        ORDER BY e.created_at DESC, e.id DESC`,
      [auth.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al consultar mis entregas:", error);
    res.status(500).json({ error: "No se pudieron consultar tus entregas" });
  }
}

// todas las entregas solo el encargado, con filtro opcional por estado
export async function listEntries(req: Request, res: Response) {
  const raw = req.query.status;
  if (raw !== undefined && (typeof raw !== "string" || !VALID_STATUSES.includes(raw))) {
    res.status(400).json({ error: "status debe ser pending, approved o rejected" });
    return;
  }

  const params: string[] = [];
  let where = "";
  if (raw !== undefined) {
    params.push(raw);
    where = "WHERE e.status = $1";
  }

  try {
    // las mas antiguas van primero para que vaya en orden
    const result = await pool.query(
      `SELECT e.id, e.user_id, u.name AS user_name,
              m.name AS material_name, m.unit, e.quantity, e.status,
              e.created_at, e.validated_by, e.validated_at
         FROM recycling_entries e
         JOIN users u ON u.id = e.user_id
         JOIN materials m ON m.id = e.material_id
        ${where}
        ORDER BY e.created_at ASC, e.id ASC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al consultar las entregas:", error);
    res.status(500).json({ error: "No se pudieron consultar las entregas" });
  }
}

// aprueba o rechaza una entrega pendiente (solo el encargado)
async function resolveEntry(req: Request, res: Response, decision: "approved" | "rejected") {
  const auth = res.locals.auth as AuthPayload;
  const entryId = Number(req.params.id);

  if (!Number.isInteger(entryId) || entryId <= 0) {
    res.status(400).json({ error: "El id de la entrega debe ser un entero positivo" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Bloquea la fila hasta terminar: dos encargados no pueden validar la misma entrega a la vez
    const found = await client.query(
      `SELECT e.id, e.user_id, e.quantity, e.status, m.points_per_unit
         FROM recycling_entries e
         JOIN materials m ON m.id = e.material_id
        WHERE e.id = $1
        FOR UPDATE OF e`,
      [entryId]
    );

    if (found.rowCount === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Entrega no encontrada" });
      return;
    }

    const entry = found.rows[0];
    if (entry.status !== "pending") {
      await client.query("ROLLBACK");
      res.status(409).json({ error: `La entrega ya fue validada (${entry.status})` });
      return;
    }

    // Los puntos se calculan aquí, nunca en el frontend
    let points = 0;
    if (decision === "approved") {
      points = entry.quantity * entry.points_per_unit;
      await client.query(
        "INSERT INTO point_logs (user_id, entry_id, points) VALUES ($1, $2, $3)",
        [entry.user_id, entry.id, points]
      );
    }

    const updated = await client.query(
      `UPDATE recycling_entries
          SET status = $2, validated_by = $3, validated_at = NOW()
        WHERE id = $1
        RETURNING id, user_id, status, validated_by, validated_at`,
      [entryId, decision, auth.id]
    );

    await client.query("COMMIT");
    res.json({ ...updated.rows[0], points });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al validar la entrega:", error);
    res.status(500).json({ error: "No se pudo validar la entrega" });
  } finally {
    client.release();
  }
}

export function approveEntry(req: Request, res: Response) {
  return resolveEntry(req, res, "approved");
}

export function rejectEntry(req: Request, res: Response) {
  return resolveEntry(req, res, "rejected");
}