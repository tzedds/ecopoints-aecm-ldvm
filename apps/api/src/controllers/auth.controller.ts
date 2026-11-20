import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db/pool";
import { AuthPayload, signToken } from "../auth/jwt";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    res.status(400).json({ error: "email y password son obligatorios" });
    return;
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email, role, password_hash FROM users WHERE email = $1",
      [email.trim().toLowerCase()]
    );
    const user = result.rows[0];

    // mismo mensaje si el correo no existe o la contraseña falla
    const valid = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!valid) {
      res.status(401).json({ error: "Credenciales inválidas" });
      return;
    }

    const token = signToken(user.id, user.role);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ error: "No se pudo iniciar sesión" });
  }
}

export async function me(_req: Request, res: Response) {
  const auth = res.locals.auth as AuthPayload;
  try {
    const result = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [auth.id]
    );
    if (result.rowCount === 0) {
      res.status(401).json({ error: "Usuario no encontrado" });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al consultar el usuario:", error);
    res.status(500).json({ error: "No se pudo consultar el usuario" });
  }
}