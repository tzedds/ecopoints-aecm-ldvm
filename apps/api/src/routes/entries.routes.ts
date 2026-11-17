import { Router } from "express";
import { createEntry } from "../controllers/entries.controller";

const router = Router();

router.post("/entries", createEntry);

export default router;