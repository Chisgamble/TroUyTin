import { getFlattenedRoomsForAI } from "../mocks/room.transformer";

interface SearchFilters {
  district?: string;
  maxPrice?: number;
  requiredAmenities?: string[];
}

type FlattenedRoom = ReturnType<typeof getFlattenedRoomsForAI>[number];

/**
 * AISearchService
 * - Uses an LLM (OpenAI-compatible) to extract structured search filters
 * - Falls back to a heuristic parser when the LLM call fails
 * - Ranks rooms by how closely they match the user's request, not only exact filters
 */
export class AISearchService {
  async searchRooms(userQuery: string) {
    const extractedFilters = await this.extractFiltersWithLLM(userQuery);
    const mockRooms = getFlattenedRoomsForAI();
    const normalize = (s?: string) =>
      (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim();
    const queryWords = this.extractKeywords(userQuery);

    const scoredRooms = mockRooms
      .map((room) => {
        let score = 0;
        const reasons: string[] = [];
        const roomText = [
          room.title,
          room.description,
          room.district,
          room.ward,
          room.room_type,
          ...(room.amenities || []),
        ]
          .filter(Boolean)
          .join(" ");
        const normalizedRoomText = normalize(roomText);

        if (extractedFilters.district) {
          const roomDistrict = normalize(room.district || "");
          const filterDistrict = normalize(extractedFilters.district);

          if (roomDistrict.includes(filterDistrict)) {
            score += 12;
            reasons.push("khu vực phù hợp");
          } else if (filterDistrict.length > 2) {
            const overlap = this.getTokenOverlap(filterDistrict, roomDistrict);
            if (overlap > 0) {
              score += 4;
              reasons.push("gần khu vực cần tìm");
            }
          }
        }

        if (typeof extractedFilters.maxPrice === "number") {
          if (typeof room.price === "number") {
            if (room.price <= extractedFilters.maxPrice) {
              score += 10;
              reasons.push("giá phù hợp");
            } else if (room.price <= extractedFilters.maxPrice * 1.2) {
              score += 3;
              reasons.push("giá gần ngưỡng");
            } else {
              score -= 2;
            }
          }
        }

        if (
          extractedFilters.requiredAmenities &&
          extractedFilters.requiredAmenities.length > 0
        ) {
          const roomAmenities = (room.amenities || []).map((a: string) =>
            normalize(a),
          );
          const required = extractedFilters.requiredAmenities.map((a) =>
            normalize(a),
          );
          let matchedAmenities = 0;

          for (const req of required) {
            if (roomAmenities.some((ra) => ra.includes(req))) {
              matchedAmenities += 1;
            }
          }

          if (matchedAmenities > 0) {
            score += matchedAmenities * 6;
            reasons.push("có tiện ích phù hợp");
          }
        }

        for (const word of queryWords) {
          if (!word) continue;
          if (normalizedRoomText.includes(word)) {
            score += word.length > 3 ? 3 : 2;
          }
        }

        if (queryWords.length === 0) {
          score += 1;
        }

        return {
          room: {
            ...room,
            matchScore: score,
            matchReason: reasons[0] || "phù hợp chung",
          } as FlattenedRoom & { matchScore: number; matchReason: string },
          score,
        };
      })
      .sort((a, b) => b.score - a.score);

    const hasPositiveScore = scoredRooms.some((item) => item.score > 0);
    const rankedRooms = (
      hasPositiveScore
        ? scoredRooms.filter((item) => item.score > 0)
        : scoredRooms
    )
      .slice(0, 12)
      .map(({ room }) => room);

    return rankedRooms;
  }

  private extractKeywords(query: string): string[] {
    const stopWords = new Set([
      "tìm",
      "tim",
      "phòng",
      "phong",
      "tro",
      "trọ",
      "gần",
      "gan",
      "có",
      "co",
      "theo",
      "cho",
      "và",
      "va",
      "gia",
      "giá",
      "dưới",
      "duoi",
      "trên",
      "tren",
      "một",
      "mot",
      "các",
      "cac",
      "nhu",
      "như",
      "thích",
      "thich",
      "muốn",
      "muon",
      "ở",
      "o",
      "ở",
      "de",
      "để",
      "dung",
      "đi",
      "di",
      "làm",
      "lam",
    ]);

    return Array.from(
      new Set(
        (query || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .split(
            /[^a-z0-9áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ\s]+/u,
          )
          .map((word) => word.trim())
          .filter((word) => word.length >= 2 && !stopWords.has(word)),
      ),
    );
  }

  private getTokenOverlap(left: string, right: string): number {
    const leftTokens = left
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
    const rightTokens = right
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    return leftTokens.filter((token) => rightTokens.includes(token)).length;
  }

  /**
   * extractFiltersWithLLM
   * - Calls an OpenAI-compatible chat completion endpoint and expects a JSON response
   * - Uses `process.env.TROUYTIN_API_KEY` as the Bearer token
   * - If the LLM call fails or returns unparsable output, falls back to a lightweight heuristic parser
   */
  private async extractFiltersWithLLM(query: string): Promise<SearchFilters> {
    const apiKey = process.env.TROUYTIN_API_KEY;
    const fallback = this.heuristicParse(query);

    if (!apiKey) return fallback;

    try {
      // Use global fetch if available (Node 18+). If not available, attempt dynamic import of node-fetch.
      let fetchFn: typeof fetch;
      if (typeof fetch !== "undefined") {
        // @ts-ignore
        fetchFn = fetch;
      } else {
        // dynamic import to avoid adding direct dependency at top-level
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const nodeFetch = await import("node-fetch");
        // @ts-ignore
        fetchFn = nodeFetch.default;
      }

      const systemPrompt = `You are a helpful assistant that extracts structured search filters from a user's free-text housing query. Return ONLY valid JSON that matches the following TypeScript interface: { district?: string; maxPrice?: number; requiredAmenities?: string[] }. Use numeric VND for maxPrice (e.g., 3000000). Omit keys that are not present.`;

      const userPrompt = `User query: "${query.replace(/\"/g, '\\"')}"`;

      const body = {
        model: "gpt-3.5-turbo-0613",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0,
        max_tokens: 300,
      };

      const res = await fetchFn("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        // timeout handling can be added by AbortController if desired
      });

      if (!res.ok) {
        return fallback;
      }

      const payload = (await res.json()) as {
        choices?: Array<{
          message?: { content?: string | null };
        }>;
      };

      // The model response usually at payload.choices[0].message.content
      const message = payload?.choices?.[0]?.message?.content;
      if (!message || typeof message !== "string") return fallback;

      // Try to parse JSON from the model output. The model may surround JSON with backticks
      const jsonTextMatch = message.match(/\{[\s\S]*\}/);
      const jsonText = jsonTextMatch ? jsonTextMatch[0] : message;

      const parsed = JSON.parse(jsonText) as SearchFilters;

      // Basic validation and normalization
      const result: SearchFilters = {};
      if (parsed.district && typeof parsed.district === "string")
        result.district = parsed.district;
      if (parsed.maxPrice && typeof parsed.maxPrice === "number")
        result.maxPrice = parsed.maxPrice;
      if (Array.isArray(parsed.requiredAmenities))
        result.requiredAmenities = parsed.requiredAmenities.map(String);

      return result;
    } catch (err) {
      return fallback;
    }
  }

  /**
   * heuristicParse
   * Lightweight parser used when the LLM call cannot be made or fails.
   * - Recognizes districts by matching against mock data districts
   * - Recognizes price expressions like "3 triệu" -> 3_000_000
   * - Picks up amenity keywords if they appear in the query
   */
  private heuristicParse(query: string): SearchFilters {
    const q = (query || "").toLowerCase();
    const rooms = getFlattenedRoomsForAI();

    const normalize = (s: string) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");

    // districts available in mock data
    const districts = Array.from(
      new Set(rooms.map((r) => (r.district || "").toString())),
    ).filter(Boolean);

    let district: string | undefined;
    for (const d of districts) {
      if (!d) continue;
      const dn = normalize(d);
      if (q.includes(dn) || q.includes(dn.replace(/quan |q\.? /g, ""))) {
        district = d;
        break;
      }
    }

    // price: look for patterns like "3 triệu", "3000000", "3.5 triệu"
    let maxPrice: number | undefined;
    const triMatch = q.match(/([0-9]+(?:[\.,][0-9]+)?)\s*tri[eê]u/);
    if (triMatch?.[1]) {
      const num = parseFloat(triMatch[1].replace(/,/g, "."));
      if (!Number.isNaN(num)) maxPrice = Math.round(num * 1_000_000);
    } else {
      const vndMatch = q.match(/([0-9]{4,})\s*(vnd|đ|dong)?/);
      if (vndMatch?.[1]) {
        const num = parseInt(vndMatch[1].replace(/\D/g, ""), 10);
        if (!Number.isNaN(num)) maxPrice = num;
      }
    }

    // amenities: collect all amenity names from mock data and check if any appear
    const amenitySet = new Set<string>();
    for (const r of rooms) {
      for (const a of r.amenities || []) amenitySet.add(a.toString());
    }
    const amenityList = Array.from(amenitySet);
    const requiredAmenities: string[] = [];
    for (const a of amenityList) {
      const an = normalize(a);
      if (q.includes(an)) requiredAmenities.push(a);
    }

    const out: SearchFilters = {};
    if (district) out.district = district;
    if (typeof maxPrice === "number") out.maxPrice = maxPrice;
    if (requiredAmenities.length) out.requiredAmenities = requiredAmenities;

    return out;
  }
}
