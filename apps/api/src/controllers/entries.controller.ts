import { Request, Response } from "express";
import { pool } from "../db/pool";

export async function createEntry(req: Request, res: Response) {
  const { user_id, material_id, quantity } = req.body ?? {};

  // 1. Validar que sean enteros positivos
  if (
    !Number.isInteger(user_id) || user_id <= 0 ||
    !Number.isInteger(material_id) || material_id <= 0 ||
    !Number.isInteger(quantity) || quantity <= 0
  ) {
    res.status(400).json({
      error: "user_id, material_id y quantity deben ser números enteros positivos",
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
    const user = await pool.query("SELECT id FROM users WHERE id = $1", [user_id]);
    if (user.rowCount === 0) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    // 4. Guardar. El estado queda 'pending' por defecto en la base de datos
    const result = await pool.query(
      `INSERT INTO recycling_entries (user_id, material_id, quantity)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, material_id, quantity, status, created_at`,
      [user_id, material_id, quantity]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al registrar la entrega:", error);
    res.status(500).json({ error: "No se pudo registrar la entrega" });
  }
}