import { Router } from "express";
import healthRoutes from "./health.routes";
import materialsRoutes from "./materials.routes";
import entriesRoutes from "./entries.routes";
import authRoutes from "./auth.routes";
import pointsRoutes from "./points.routes";
import rankingRoutes from "./ranking.routes";

const router = Router();

router.use(healthRoutes);
router.use(materialsRoutes);
router.use(entriesRoutes);
router.use(authRoutes);
router.use(pointsRoutes);
router.use(rankingRoutes);

export default router;