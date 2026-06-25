import { Router } from "express";
import { searchRoomsWithAI } from "../controllers/room.controller";

const router = Router();
router.post("/ai-search", searchRoomsWithAI);

export default router;
