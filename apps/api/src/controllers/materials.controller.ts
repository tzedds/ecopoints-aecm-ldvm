import { Request, Response } from "express";
import { pool } from "../db/pool";

interface Material {
  id: number;
  name: string;
  unit: string;
  points_per_unit: number;
}

export async function getMaterials(_req: Request, res: Response) {
    const result = await pool.query<Material>(
      `SELECT id, name, unit, points_per_unit
         FROM materials
        WHERE active = TRUE
        ORDER BY name`
    );
    res.json(result.rows);
  } 
