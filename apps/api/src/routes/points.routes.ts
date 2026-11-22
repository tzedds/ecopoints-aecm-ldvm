import { Router } from "express";
import { getMyPoints } from "../controllers/points.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/points/me", requireAuth, getMyPoints);

export default router;