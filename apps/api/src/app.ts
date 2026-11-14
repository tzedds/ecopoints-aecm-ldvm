import express from "express";
import cors from "cors";
import { config } from "./config";
import routes from "./routes";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use("/api", routes);

app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

export default app;