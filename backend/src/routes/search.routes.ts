import { Router } from "express";
import { parseSearchQuery } from "../services/llm.service";

const router = Router();

router.post("/parse", async (req, res) => {
  try {
    const { query } = req.body as { query?: string };

    if (typeof query !== "string") {
      return res.status(400).json({ error: "query is required" });
    }

    const filters = await parseSearchQuery(query);
    return res.status(200).json({ filters });
  } catch (error) {
    console.error("Error parsing search query:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
});

export default router;
