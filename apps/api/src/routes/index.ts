import { Router } from "express";
import healthRoutes from "./health.routes";
import materialsRoutes from "./materials.routes";
import entriesRoutes from "./entries.routes";

const router = Router();

router.use(healthRoutes);
router.use(materialsRoutes);
router.use(entriesRoutes);

export default router;