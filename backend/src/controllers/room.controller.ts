import { Request, Response } from "express";
import { AISearchService } from "../services/ai-search.service";

const aiService = new AISearchService();

/**
 * Controller: searchRoomsWithAI
 * Expects: POST body { query: string }
 * Returns: { success: boolean, data?: any[], message?: string }
 */
export const searchRoomsWithAI = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid request: 'query' is required and must be a non-empty string.",
      });
    }

    const rooms = await aiService.searchRooms(query);

    return res.json({ success: true, data: rooms });
  } catch (error) {
    console.error("AI search error:", error);
    return res
      .status(500)
      .json({ success: false, message: "AI Search failed" });
  }
};
