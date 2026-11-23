import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthPayload, Role, verifyToken } from "../auth/jwt";
import { forbidden, unauthorized } from "../errors";

// Exige un token válido y deja los datos del usuario en res.locals.auth
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  if (scheme !== "Bearer" || !token) {
    next (unauthorized("Falta el token de autenticación"));
    return;
  }
  try {
    res.locals.auth = verifyToken(token);
    next();
  } catch (error) {
    // token malo o venvido=401, cualquiera otro =500
    if (error instanceof jwt.JsonWebTokenError) {
      next(unauthorized("Token inválido o expirado"));
    } else {
      next(error);
    }
  }
}

export function requireRole(...roles: Role[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const auth = res.locals.auth as AuthPayload | undefined;
    if (!auth || !roles.includes(auth.role)) {
      next(forbidden());
      return;
    }
    next();
  };
}