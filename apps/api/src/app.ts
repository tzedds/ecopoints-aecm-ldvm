import express from "express";
import cors from "cors";
import { config } from "./config";
import routes from "./routes";
import { errorHandler, notFoundHandler} from "./middleware/error-handler";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;