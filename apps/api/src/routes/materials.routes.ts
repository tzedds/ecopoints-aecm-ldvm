import { Router } from "express";
import { getMaterials } from "../controllers/materials.controller";

const router = Router();

router.get("/materials", getMaterials);

export default router;