import { Router } from "express";
import healthRoutes from "./health.routes";
import materialsRoutes from "./materials.routes";

const router = Router();

router.use(healthRoutes);
router.use(materialsRoutes);

export default router;