import { Router } from "express";
import { getRanking } from "../controllers/ranking.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/ranking", requireAuth, getRanking);

export default router;