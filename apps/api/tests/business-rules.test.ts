import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ANA,
  ELI,
  api,
  countPointLogs,
  createParticipant,
  darPuntos,
  entryRow,
  loginAs,
  pointLogRows,
  prepareDatabase,
  resetData,
  startServer,
  stopServer,
  userId,
} from "./helpers";

// Materiales del seed (database/seeds/001_seed.sql)
const PAPEL = 1; // 2 puntos por kg
const PET = 2; // 5 puntos por kg
const LATAS = 4; // 8 puntos por kg

before(async () => {
  await prepareDatabase();
  await startServer();
});

after(async () => {
  await stopServer();
});

beforeEach(async () => {
  await resetData();
});

describe("Solo las entregas aprobadas generan puntos", () => {
  it("una entrega pendiente no genera puntos", async () => {
    const ana = await loginAs(ANA);
    const created = await api("POST", "/entries", {
      token: ana,
      body: { material_id: PET, quantity: 5 },
    });

    assert.equal(created.status, 201);
    assert.equal(created.body.status, "pending");
    assert.equal(await countPointLogs(), 0);

    const points = await api("GET", "/points/me", { token: ana });
    assert.equal(points.body.total, 0);
  });

  it("una entrega rechazada no genera puntos", async () => {
    const ana = await loginAs(ANA);
    const eli = await loginAs(ELI);
    const created = await api("POST", "/entries", {
      token: ana,
      body: { material_id: PET, quantity: 5 },
    });

    const rejected = await api("PATCH", `/entries/${created.body.id}/reject`, { token: eli });

    assert.equal(rejected.status, 200);
    assert.equal(rejected.body.status, "rejected");
    assert.equal(rejected.body.points, 0);
    assert.equal(await countPointLogs(), 0);
  });

  it("una entrega aprobada genera cantidad × puntos del material", async () => {
    const ana = await loginAs(ANA);
    const eli = await loginAs(ELI);
    const created = await api("POST", "/entries", {
      token: ana,
      body: { material_id: PET, quantity: 5 },
    });

    const approved = await api("PATCH", `/entries/${created.body.id}/approve`, { token: eli });

    assert.equal(approved.status, 200);
    assert.equal(approved.body.status, "approved");
    assert.equal(approved.body.points, 25); // 5 kg × 5 puntos

    const logs = await pointLogRows();
    assert.equal(logs.length, 1);
    assert.equal(logs[0].points, 25);
    assert.equal(logs[0].user_id, await userId(ANA));

    const row = await entryRow(created.body.id);
    assert.equal(row.validated_by, await userId(ELI));
    assert.ok(row.validated_at);

    const points = await api("GET", "/points/me", { token: ana });
    assert.equal(points.body.total, 25);
  });
});

describe("Los puntos no se aceptan desde el frontend", () => {
  it("al registrar, la API ignora 'points' y 'user_id' del cuerpo", async () => {
    const ana = await loginAs(ANA);

    const created = await api("POST", "/entries", {
      token: ana,
      body: { material_id: PET, quantity: 1, points: 9999, user_id: await userId(ELI) },
    });

    assert.equal(created.status, 201);
    assert.equal(created.body.user_id, await userId(ANA));
    assert.equal(await countPointLogs(), 0);
  });

  it("al aprobar, los puntos los calcula el servidor aunque el cliente mande otros", async () => {
    const ana = await loginAs(ANA);
    const eli = await loginAs(ELI);
    const created = await api("POST", "/entries", {
      token: ana,
      body: { material_id: PET, quantity: 1 },
    });

    const approved = await api("PATCH", `/entries/${created.body.id}/approve`, {
      token: eli,
      body: { points: 9999 },
    });

    assert.equal(approved.status, 200);
    assert.equal(approved.body.points, 5); // 1 kg × 5 puntos
    assert.equal((await pointLogRows())[0].points, 5);
  });
});

describe("Una entrega no se valida dos veces", () => {
  it("aprobar dos veces: la segunda da 409 y no duplica puntos", async () => {
    const ana = await loginAs(ANA);
    const eli = await loginAs(ELI);
    const created = await api("POST", "/entries", {
      token: ana,
      body: { material_id: PET, quantity: 5 },
    });
    const url = `/entries/${created.body.id}/approve`;

    const first = await api("PATCH", url, { token: eli });
    const second = await api("PATCH", url, { token: eli });

    assert.equal(first.status, 200);
    assert.equal(second.status, 409);
    assert.equal(second.body.code, "CONFLICT");
    assert.equal(await countPointLogs(), 1);
  });

  it("una entrega aprobada ya no se puede rechazar", async () => {
    const ana = await loginAs(ANA);
    const eli = await loginAs(ELI);
    const created = await api("POST", "/entries", {
      token: ana,
      body: { material_id: PET, quantity: 5 },
    });

    await api("PATCH", `/entries/${created.body.id}/approve`, { token: eli });
    const reject = await api("PATCH", `/entries/${created.body.id}/reject`, { token: eli });

    assert.equal(reject.status, 409);
    assert.equal((await entryRow(created.body.id)).status, "approved");
    assert.equal(await countPointLogs(), 1);
  });

  it("dos aprobaciones simultáneas: solo una gana", async () => {
    const ana = await loginAs(ANA);
    const eli = await loginAs(ELI);
    const created = await api("POST", "/entries", {
      token: ana,
      body: { material_id: PET, quantity: 5 },
    });
    const url = `/entries/${created.body.id}/approve`;

    const [a, b] = await Promise.all([
      api("PATCH", url, { token: eli }),
      api("PATCH", url, { token: eli }),
    ]);

    assert.deepEqual([a.status, b.status].sort(), [200, 409]);
    assert.equal(await countPointLogs(), 1);
  });
});

describe("Permisos: solo el encargado valida", () => {
  it("un participante no puede aprobar (403) y la entrega sigue pendiente", async () => {
    const ana = await loginAs(ANA);
    const created = await api("POST", "/entries", {
      token: ana,
      body: { material_id: PET, quantity: 5 },
    });

    const res = await api("PATCH", `/entries/${created.body.id}/approve`, { token: ana });

    assert.equal(res.status, 403);
    assert.equal(res.body.code, "FORBIDDEN");
    assert.equal((await entryRow(created.body.id)).status, "pending");
    assert.equal(await countPointLogs(), 0);
  });

  it("un participante no puede rechazar (403)", async () => {
    const ana = await loginAs(ANA);
    const created = await api("POST", "/entries", {
      token: ana,
      body: { material_id: PET, quantity: 5 },
    });

    const res = await api("PATCH", `/entries/${created.body.id}/reject`, { token: ana });

    assert.equal(res.status, 403);
    assert.equal((await entryRow(created.body.id)).status, "pending");
  });

  it("sin token no se puede aprobar (401)", async () => {
    const res = await api("PATCH", "/entries/1/approve");

    assert.equal(res.status, 401);
    assert.equal(res.body.code, "UNAUTHORIZED");
  });

  it("solo el encargado puede listar las entregas pendientes", async () => {
    const ana = await loginAs(ANA);
    const eli = await loginAs(ELI);
    await api("POST", "/entries", { token: ana, body: { material_id: PET, quantity: 5 } });

    const comoParticipante = await api("GET", "/entries?status=pending", { token: ana });
    const comoEncargado = await api("GET", "/entries?status=pending", { token: eli });

    assert.equal(comoParticipante.status, 403);
    assert.equal(comoEncargado.status, 200);
    assert.equal(comoEncargado.body.length, 1);
  });
});

describe("El ranking", () => {
  it("sale ordenado, con empates compartidos, participantes en 0 y sin el encargado", async () => {
    await createParticipant("Bruno Reciclador", "bruno@ecopoints.test");
    await createParticipant("Carla Verde", "carla@ecopoints.test");
    await createParticipant("Diego Eco", "diego@ecopoints.test");
    await createParticipant("Eva Nueva", "eva@ecopoints.test");

    await darPuntos("bruno@ecopoints.test", LATAS, 10); // 80 puntos
    await darPuntos("carla@ecopoints.test", PET, 16); // 80 puntos (empate)
    await darPuntos(ANA, PET, 3); // 15 puntos
    await darPuntos("diego@ecopoints.test", PAPEL, 5); // 10 puntos
    // Eva no entrega nada: debe aparecer con 0

    const ana = await loginAs(ANA);
    const res = await api("GET", "/ranking", { token: ana });
    const rows = res.body as Array<{ position: number; name: string; total_points: number }>;

    assert.equal(res.status, 200);
    assert.deepEqual(
      rows.map((r) => [r.position, r.name, r.total_points]),
      [
        [1, "Bruno Reciclador", 80],
        [1, "Carla Verde", 80],
        [3, "Ana Participante", 15],
        [4, "Diego Eco", 10],
        [5, "Eva Nueva", 0],
      ]
    );
    assert.ok(!rows.some((r) => r.name === "Eli Encargado"));
    assert.equal(typeof rows[0].total_points, "number");
  });

  it("exige sesión", async () => {
    const res = await api("GET", "/ranking");

    assert.equal(res.status, 401);
  });
});