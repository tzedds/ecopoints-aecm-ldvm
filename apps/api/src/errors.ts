export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message: string) => new HttpError(400, "BAD_REQUEST", message);
export const unauthorized = (message = "No autenticado") =>
  new HttpError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "No tienes permiso para esta acción") =>
  new HttpError(403, "FORBIDDEN", message);
export const notFound = (message = "Recurso no encontrado") =>
  new HttpError(404, "NOT_FOUND", message);
export const conflict = (message: string) => new HttpError(409, "CONFLICT", message);