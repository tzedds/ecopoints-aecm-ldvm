import jwt from "jsonwebtoken";
import { config } from "../config";

export type Role = "participant" | "manager";

export interface AuthPayload {
  id: number;
  role: Role;
}

export function signToken(id: number, role: Role): string {
  if (!config.jwtSecret) throw new Error("JWT_SECRET no está configurado");
  return jwt.sign({ role }, config.jwtSecret, {
    subject: String(id),
    expiresIn: "8h",
    algorithm: "HS256",
  });
}

export function verifyToken(token: string): AuthPayload {
  if (!config.jwtSecret) throw new Error("JWT_SECRET no está configurado");
  const payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
  if (
    typeof payload === "string" ||
    !payload.sub ||
    (payload.role !== "participant" && payload.role !== "manager")
  ) {
    throw new Error("Token inválido");
  }
  return { id: Number(payload.sub), role: payload.role };
}