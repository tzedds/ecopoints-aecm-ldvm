import { NextFunction, Request, Response } from "express";
import { AuthPayload, Role, verifyToken } from "../auth/jwt";

// Exige un token válido y deja los datos del usuario en res.locals.auth
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Falta el token de autenticación" });
    return;
  }
  try {
    res.locals.auth = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}

export function requireRole(...roles: Role[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const auth = res.locals.auth as AuthPayload | undefined;
    if (!auth || !roles.includes(auth.role)) {
      res.status(403).json({ error: "No tienes permiso para esta acción" });
      return;
    }
    next();
  };
}