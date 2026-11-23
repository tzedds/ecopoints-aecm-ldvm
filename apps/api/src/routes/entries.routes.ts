import { Router } from "express";
import { approveEntry, createEntry, listEntries, listMyEntries, rejectEntry} from "../controllers/entries.controller";
import { requireAuth, requireRole} from "../middleware/auth";

const router = Router();

router.post("/entries", requireAuth,  createEntry);
router.get ("/entries/mine", requireAuth, listMyEntries);
router.get ("/entries", requireAuth, requireRole("manager"), listEntries);
router.patch("/entries/:id/approve", requireAuth, requireRole("manager"), approveEntry);
router.patch("/entries/:id/reject", requireAuth, requireRole("manager"), rejectEntry);

export default router;