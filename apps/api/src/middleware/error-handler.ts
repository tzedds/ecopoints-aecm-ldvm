import { NextFunction, Request, Response } from "express";
import { HttpError, notFound } from "../errors";

// se ejecuta cuando ninguna ruta responde
export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(notFound("Ruta no encontrada"));
}

export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }

  if ((err as { type?: string } | null)?.type === "entity.parse.failed") {
    res.status(400).json({
      error: "El cuerpo de la petición no es un JSON válido",
      code: "BAD_REQUEST",
    });
    return;
  }

  // cualquier otro fallo es inesperado se registra y no se exponen detalles
  console.error("Error no controlado:", err);
  res.status(500).json({ error: "Error interno del servidor", code: "INTERNAL_ERROR" });
}