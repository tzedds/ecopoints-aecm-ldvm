import { Router } from "express";
import { listHistory } from "../controllers/history.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/history", requireAuth, listHistory);

export default router;