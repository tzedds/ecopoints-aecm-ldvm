import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db/pool";
import { AuthPayload, signToken } from "../auth/jwt";
import { badRequest, unauthorized } from "../errors";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      throw badRequest("email y password son obligatorios");
  }

    const result = await pool.query(
      "SELECT id, name, email, role, password_hash FROM users WHERE email = $1",
      [email.trim().toLowerCase()]
    );
    const user = result.rows[0];

    // mismo mensaje si el correo no existe o la contraseña falla
    const valid = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!valid) throw unauthorized ("Credenciales inválidas");

    const token = signToken(user.id, user.role);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
}

export async function me(_req: Request, res: Response) {
  const auth = res.locals.auth as AuthPayload;
    const result = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [auth.id]
    );
    if (result.rowCount === 0) throw unauthorized ("Usuario no encontrado");
      res.json(result.rows[0]);
}