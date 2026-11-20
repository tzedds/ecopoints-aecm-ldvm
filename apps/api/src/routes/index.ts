import { Router } from "express";
import healthRoutes from "./health.routes";
import materialsRoutes from "./materials.routes";
import entriesRoutes from "./entries.routes";
import authRoutes from "./auth.routes";

const router = Router();

router.use(healthRoutes);
router.use(materialsRoutes);
router.use(entriesRoutes);
router.use(authRoutes);

export default router;