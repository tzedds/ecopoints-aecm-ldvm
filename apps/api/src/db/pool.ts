import { Pool } from "pg";
import { config } from "../config";

// El pool no se conecta hasta que se hace la primera consulta,
// así que la API arranca aunque la base de datos aún no exista.
export const pool = new Pool({
  connectionString: config.databaseUrl,
});