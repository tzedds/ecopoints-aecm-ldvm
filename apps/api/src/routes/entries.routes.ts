import { Router } from "express";
import { createEntry, listEntries, listMyEntries } from "../controllers/entries.controller";
import { requireAuth, requireRole} from "../middleware/auth";

const router = Router();

router.post("/entries", requireAuth,  createEntry);
router.get ("/entries/mine", requireAuth, listMyEntries);
router.get ("/entries", requireAuth, requireRole("manager"), listEntries);

export default router;