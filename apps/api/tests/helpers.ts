import { once } from "node:events";
import { readFileSync } from "node:fs";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { Pool } from "pg";

const TEST_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://ecopoints:ecopoints@localhost:5432/ecopoints_test";

const dbName = new URL(TEST_URL).pathname.slice(1);

// estas pruebas borran datos, así que solo corren contra una base que termine en _test
if (!/^[a-z0-9_]+_test$/.test(dbName)) {
  throw new Error(
    `TEST_DATABASE_URL debe apuntar a una base cuyo nombre termine en _test (recibido: "${dbName}")`
  );
}

process.env.DATABASE_URL = TEST_URL;
process.env.JWT_SECRET ||= "secreto-solo-para-pruebas";
process.env.CORS_ORIGIN ||= "http://localhost:3001";

export const PASSWORD = "Demo1234!";
export const ANA = "participante@ecopoints.test";
export const ELI = "encargado@ecopoints.test";

const db = new Pool({ connectionString: TEST_URL });
const dbRoot = path.resolve(__dirname, "../../../database");

let server: Server | undefined;
let baseUrl = "";

// crea la base de pruebas si no existe y la deja con el esquema y el seed reales
export async function prepareDatabase() {
  const adminUrl = new URL(TEST_URL);
  adminUrl.pathname = "/postgres";
  const admin = new Pool({ connectionString: adminUrl.toString() });
  try {
    const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (exists.rowCount === 0) await admin.query(`CREATE DATABASE "${dbName}"`);
  } finally {
    await admin.end();
  }

  await db.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await db.query(readFileSync(path.join(dbRoot, "migrations/001_initial_schema.sql"), "utf8"));
  await db.query(readFileSync(path.join(dbRoot, "seeds/001_seed.sql"), "utf8"));
}

// deja la base como el seed: sin entregas, sin puntos y solo con los dos usuarios de demo
export async function resetData() {
  await db.query("TRUNCATE point_logs, recycling_entries RESTART IDENTITY CASCADE");
  await db.query("DELETE FROM users WHERE email NOT IN ($1, $2)", [ANA, ELI]);
}

export async function startServer() {
  const { default: app } = await import("../src/app");
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

export async function stopServer() {
  if (server) {
    await new Promise<void>((resolve) => {
      server!.close(() => resolve());
      server!.closeAllConnections();
    });
  }
  const { pool } = await import("../src/db/pool");
  await pool.end();
  await db.end();
}

interface ApiOptions {
  token?: string;
  body?: unknown;
}

export async function api(method: string, route: string, opts: ApiOptions = {}) {
  const headers: Record<string, string> = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${baseUrl}/api${route}`, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

export async function loginAs(email: string): Promise<string> {
  const res = await api("POST", "/auth/login", { body: { email, password: PASSWORD } });
  if (res.status !== 200) throw new Error(`No se pudo iniciar sesión como ${email} (${res.status})`);
  return res.body.token;
}

export async function userId(email: string): Promise<number> {
  const r = await db.query("SELECT id FROM users WHERE email = $1", [email]);
  return r.rows[0].id;
}

export async function createParticipant(name: string, email: string): Promise<number> {
  const r = await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, crypt($3, gen_salt('bf', 10)), 'participant') RETURNING id`,
    [name, email, PASSWORD]
  );
  return r.rows[0].id;
}

export async function countPointLogs(): Promise<number> {
  const r = await db.query("SELECT COUNT(*)::int AS n FROM point_logs");
  return r.rows[0].n;
}

export async function pointLogRows() {
  const r = await db.query("SELECT user_id, entry_id, points FROM point_logs ORDER BY id");
  return r.rows;
}

export async function entryRow(id: number) {
  const r = await db.query(
    "SELECT status, validated_by, validated_at FROM recycling_entries WHERE id = $1",
    [id]
  );
  return r.rows[0];
}

// Atajo: un participante registra una entrega y el encargado la aprueba
export async function darPuntos(email: string, materialId: number, quantity: number) {
  const token = await loginAs(email);
  const eli = await loginAs(ELI);
  const created = await api("POST", "/entries", {
    token,
    body: { material_id: materialId, quantity },
  });
  return api("PATCH", `/entries/${created.body.id}/approve`, { token: eli });
}