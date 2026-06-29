import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

export const roomSearchFilterSchema = z.object({
  district_name: z.string().nullable(),
  room_type: z
    .enum(["PHONG_TRO", "CAN_HO_MINI", "KTX", "NGUYEN_CAN"])
    .nullable(),
  price_min: z.number().nullable(),
  price_max: z.number().nullable(),
  area_min: z.number().nullable(),
  area_max: z.number().nullable(),
  keywords: z.string().nullable(),
});

export type RoomSearchFilter = z.infer<typeof roomSearchFilterSchema>;

const EMPTY_FILTER: RoomSearchFilter = {
  district_name: null,
  room_type: null,
  price_min: null,
  price_max: null,
  area_min: null,
  area_max: null,
  keywords: null,
};

const DISTRICT_PATTERNS: { pattern: RegExp; name: string }[] = [
  { pattern: /quận\s*1\b|quan\s*1\b/i, name: "Quận 1" },
  { pattern: /quận\s*3\b|quan\s*3\b/i, name: "Quận 3" },
  { pattern: /quận\s*7\b|quan\s*7\b/i, name: "Quận 7" },
  { pattern: /bình thạnh|binh thanh/i, name: "Quận Bình Thạnh" },
  { pattern: /phú nhuận|phu nhuan/i, name: "Quận Phú Nhuận" },
  { pattern: /tân bình|tan binh/i, name: "Quận Tân Bình" },
  { pattern: /gò vấp|go vap/i, name: "Quận Gò Vấp" },
  { pattern: /thủ đức|thu duc/i, name: "TP. Thủ Đức" },
];

const ROOM_TYPE_PATTERNS: {
  pattern: RegExp;
  type: RoomSearchFilter["room_type"];
}[] = [
  { pattern: /căn hộ mini|can ho mini/i, type: "CAN_HO_MINI" },
  { pattern: /ký túc|ky tuc|ktx/i, type: "KTX" },
  { pattern: /nguyên căn|nguyen can/i, type: "NGUYEN_CAN" },
  { pattern: /phòng trọ|phong tro|trọ/i, type: "PHONG_TRO" },
];

function parsePriceMillion(text: string): number | null {
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*triệu|\b(\d+)\s*tr\b/i);
  if (!match) return null;
  const value = parseFloat((match[1] || match[2]).replace(",", "."));
  return Math.round(value * 1_000_000);
}

export function parseSearchQueryFallback(query: string): RoomSearchFilter {
  const q = query.trim();
  if (!q) return { ...EMPTY_FILTER }; //[cite: 14]

  const filters: RoomSearchFilter = { ...EMPTY_FILTER };
  let cleanQuery = q;

  // 1. Lọc Quận/Huyện và xóa khỏi cleanQuery
  for (const { pattern, name } of DISTRICT_PATTERNS) {
    //[cite: 14]
    if (pattern.test(cleanQuery)) {
      filters.district_name = name;
      cleanQuery = cleanQuery.replace(pattern, "");
      break;
    }
  }

  // 2. Lọc Loại phòng và xóa khỏi cleanQuery
  for (const { pattern, type } of ROOM_TYPE_PATTERNS) {
    //[cite: 14]
    if (pattern.test(cleanQuery)) {
      filters.room_type = type;
      cleanQuery = cleanQuery.replace(pattern, "");
      break;
    }
  }

  // 3. Lọc Giá và xử lý phần text liên quan
  const price = parsePriceMillion(q); //[cite: 14]
  if (price) {
    if (/dưới|duoi|tối đa|toi da|<\s*/i.test(q)) {
      filters.price_max = price;
    } else if (/trên|tren|từ|tu|>\s*/i.test(q)) {
      filters.price_min = price;
    } else {
      filters.price_max = price; //[cite: 14]
    }
    // Xóa các cụm từ về giá
    cleanQuery = cleanQuery.replace(
      /(\d+(?:[.,]\d+)?)\s*triệu|\b(\d+)\s*tr\b/i,
      "",
    );
    cleanQuery = cleanQuery.replace(
      /dưới|duoi|tối đa|toi da|<|trên|tren|từ|tu|>/gi,
      "",
    );
  }

  // 4. Lọc Diện tích và xử lý phần text liên quan
  const areaMatch = q.match(/(\d+)\s*m²|(\d+)\s*m2/i); //[cite: 14]
  if (areaMatch) {
    const area = Number(areaMatch[1] || areaMatch[2]);
    if (/trên|tren|>\s*/i.test(q)) filters.area_min = area;
    else if (/dưới|duoi|<\s*/i.test(q)) filters.area_max = area;
    else filters.area_min = area; //[cite: 14]

    // Xóa cụm từ về diện tích
    cleanQuery = cleanQuery.replace(/(\d+)\s*m²|(\d+)\s*m2/i, "");
  }

  // 5. Lọc bỏ các từ khóa nhiễu (stop words)
  cleanQuery = cleanQuery.replace(
    /(tìm|cần tìm|thuê|cho thuê|phòng trọ|phòng|ở|đường|tại|khu vực)\s*/gi,
    " ",
  );

  // 6. Chuẩn hóa khoảng trắng và gán từ khóa còn lại
  cleanQuery = cleanQuery.replace(/\s+/g, " ").trim();
  filters.keywords = cleanQuery || null;

  return filters;
}
const SYSTEM_PROMPT = `Bạn là trợ lý phân tích câu tìm kiếm phòng trọ tại TP.HCM, Việt Nam.
Nhiệm vụ: chuyển câu tìm kiếm tự nhiên của người dùng thành bộ lọc JSON.

QUY TẮC:
- Chỉ trả về JSON thuần, không markdown, không giải thích.
- KHÔNG bao gồm latitude, longitude hay bất kỳ tọa độ nào.
- district_name: tên quận/huyện tại TP.HCM (vd: "Quận 1", "Quận Bình Thạnh", "TP. Thủ Đức") hoặc null.
- room_type: một trong PHONG_TRO | CAN_HO_MINI | KTX | NGUYEN_CAN hoặc null.
- price_min, price_max: số VNĐ/tháng (vd: "3 triệu" = 3000000) hoặc null.
- area_min, area_max: diện tích m² hoặc null.
- keywords: từ khóa còn lại (đường, tiện ích, mô tả) hoặc null.

Schema JSON:
{
  "district_name": string | null,
  "room_type": "PHONG_TRO" | "CAN_HO_MINI" | "KTX" | "NGUYEN_CAN" | null,
  "price_min": number | null,
  "price_max": number | null,
  "area_min": number | null,
  "area_max": number | null,
  "keywords": string | null
}`;

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw);
}

export async function parseSearchQuery(
  query: string,
): Promise<RoomSearchFilter> {
  const apiKey = process.env.TROUYTIN_API_KEY;
  if (!apiKey) {
    throw new Error("TROUYTIN_API_KEY is not configured");
  }

  if (!query.trim()) {
    return { ...EMPTY_FILTER };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: `${SYSTEM_PROMPT}\n\nCâu tìm kiếm: "${query.trim()}"` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const text = result.response.text();
    const parsed = extractJson(text);
    return roomSearchFilterSchema.parse(parsed);
  } catch (error) {
    return parseSearchQueryFallback(query);
  }
}
