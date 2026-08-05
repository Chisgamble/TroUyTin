import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

type UniversityEntry = {
  name: string;
  lat: number;
  lng: number;
  aliases: string[];
};

const UNIVERSITIES: UniversityEntry[] = [
  {
    name: "Đại học Quốc gia Hà Nội",
    lat: 21.0378,
    lng: 105.7816,
    aliases: ["vnu", "đhqghn", "dhqghn", "quoc gia ha noi"],
  },
  {
    name: "Đại học Bách khoa Hà Nội",
    lat: 21.0071,
    lng: 105.843,
    aliases: ["hust", "bach khoa ha noi", "bk hn", "dhbk hn", "bách khoa hn"],
  },
  {
    name: "Trường Đại học Kinh tế Quốc dân (Hà Nội)",
    lat: 21.0,
    lng: 105.8423,
    aliases: ["neu", "kinh te quoc dan", "ktqd"],
  },
  {
    name: "Trường Đại học Khoa học Tự nhiên, ĐHQGHN",
    lat: 20.9959,
    lng: 105.808,
    aliases: ["khtn hn", "khoa hoc tu nhien ha noi", "hus hn"],
  },
  {
    name: "Trường Đại học Sư phạm Hà Nội",
    lat: 21.0381,
    lng: 105.7828,
    aliases: ["sphn", "su pham ha noi"],
  },
  {
    name: "Trường Đại học Ngoại thương (Hà Nội)",
    lat: 21.0232,
    lng: 105.8052,
    aliases: ["ftu", "ngoai thuong ha noi", "ftu hn"],
  },
  {
    name: "Học viện Công nghệ Bưu chính Viễn thông",
    lat: 20.9806,
    lng: 105.7876,
    aliases: ["ptit", "buu chinh vien thong", "bcvt"],
  },
  {
    name: "Trường Đại học Y Hà Nội",
    lat: 21.0028,
    lng: 105.8306,
    aliases: ["y ha noi", "hmu"],
  },
  {
    name: "Học viện Nông nghiệp Việt Nam",
    lat: 21.0063,
    lng: 105.9332,
    aliases: ["hva", "nong nghiep viet nam", "mua"],
  },
  {
    name: "Trường Đại học Tôn Đức Thắng",
    lat: 10.7327,
    lng: 106.6998,
    aliases: ["tdtu", "ton duc thang"],
  },
  {
    name: "Đại học Bách khoa TP.HCM (Cơ sở Lý Thường Kiệt)",
    lat: 10.7724,
    lng: 106.6577,
    aliases: [
      "hcmut",
      "bach khoa hcm",
      "bách khoa hcm",
      "bk hcm",
      "dhbk hcm",
      "poly hcm",
    ],
  },
  {
    name: "Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM (Cơ sở Nguyễn Văn Cừ)",
    lat: 10.7628,
    lng: 106.6825,
    aliases: [
      "hcmus",
      "khtn",
      "khoa hoc tu nhien hcm",
      "khoa học tự nhiên",
      "hus hcm",
    ],
  },
  {
    name: "Trường Đại học Kinh tế TP.HCM (Cơ sở A)",
    lat: 10.7828,
    lng: 106.6917,
    aliases: ["ueh", "kinh te hcm", "kinh tế hcm"],
  },
  {
    name: "Trường Đại học Sư phạm Kỹ thuật TP.HCM",
    lat: 10.8507,
    lng: 106.7721,
    aliases: ["hcmute", "su pham ky thuat", "spkt hcm"],
  },
  {
    name: "Trường Đại học Sài Gòn",
    lat: 10.7599,
    lng: 106.6823,
    aliases: [
      "sgu",
      "dai hoc sai gon",
      "đại học sài gòn",
      "dhsg",
      "sai gon university",
    ],
  },
  {
    name: "Trường Đại học Nông Lâm TP.HCM",
    lat: 10.8697,
    lng: 106.7937,
    aliases: ["nlu", "nong lam hcm", "nông lâm"],
  },
  {
    name: "Trường Đại học Quốc tế, ĐHQG-HCM",
    lat: 10.8797,
    lng: 106.7972,
    aliases: ["iu", "hcmiu", "quoc te hcm", "đhqg hcm iu"],
  },
  {
    name: "Trường Đại học Công nghệ Thông tin, ĐHQG-HCM",
    lat: 10.87,
    lng: 106.8031,
    aliases: ["uit", "cntt hcm", "công nghệ thông tin"],
  },
  {
    name: "Trường Đại học Y Dược TP.HCM",
    lat: 10.7548,
    lng: 106.6653,
    aliases: ["y duoc hcm", "y dược", "ump"],
  },
  {
    name: "Đại học Cần Thơ",
    lat: 10.0299,
    lng: 105.7706,
    aliases: ["ctu", "can tho", "cần thơ"],
  },
  {
    name: "Đại học Đà Nẵng",
    lat: 16.0716,
    lng: 108.2227,
    aliases: ["dnu", "da nang", "đà nẵng", "udn"],
  },
  {
    name: "Trường Đại học Bách khoa, Đại học Đà Nẵng",
    lat: 16.0768,
    lng: 108.1504,
    aliases: ["dut", "bach khoa da nang", "bách khoa đà nẵng"],
  },
  {
    name: "Đại học Huế",
    lat: 16.4678,
    lng: 107.5905,
    aliases: ["hue university", "huế", "hue uni"],
  },
  {
    name: "Đại học Vinh",
    lat: 18.6609,
    lng: 105.6961,
    aliases: ["vinh university", "đh vinh"],
  },
  {
    name: "Đại học Đà Lạt",
    lat: 11.9546,
    lng: 108.4443,
    aliases: ["dlu", "da lat", "đà lạt"],
  },
  {
    name: "Trường Đại học Nha Trang",
    lat: 12.2681,
    lng: 109.2014,
    aliases: ["ntu", "nha trang", "nha trang university"],
  },
];

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveUniversity(input: string): UniversityEntry | null {
  const normalized = normalizeForMatch(input);
  if (!normalized) return null;

  for (const uni of UNIVERSITIES) {
    if (normalizeForMatch(uni.name) === normalized) return uni;
    for (const alias of uni.aliases) {
      if (normalizeForMatch(alias) === normalized) return uni;
    }
  }

  const candidates: { uni: UniversityEntry; aliasNorm: string }[] = [];
  for (const uni of UNIVERSITIES) {
    candidates.push({ uni, aliasNorm: normalizeForMatch(uni.name) });
    for (const alias of uni.aliases) {
      candidates.push({ uni, aliasNorm: normalizeForMatch(alias) });
    }
  }
  candidates.sort((a, b) => b.aliasNorm.length - a.aliasNorm.length);

  for (const { uni, aliasNorm } of candidates) {
    if (normalized.includes(aliasNorm) || aliasNorm.includes(normalized)) {
      return uni;
    }
  }

  return null;
}

function extractLandmarkFromQuery(query: string): string | null {
  const patterns = [
    /(?:gần|gan|near|cạnh|canh|lân cận|lan can)\s+(.+?)(?:\s+với|\s*$)/i,
    /(?:tìm|tim|cần|can)\s+(?:phòng|phong|trọ|tro)\s+(?:gần|gan|near|cạnh|canh)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function stripProximityStopWords(keywords: string | null): string | null {
  if (!keywords) return null;

  const cleaned = keywords
    .replace(
      /\b(gần|gan|near|cạnh|canh|tìm|tim|cần|can|phòng|phong|trọ|tro|ở|o|khu vực|khu vuc|tại|tai)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || null;
}

function applyUniversityToFilters(
  filters: RoomSearchFilter,
  university: UniversityEntry,
): RoomSearchFilter {
  return {
    ...filters,
    landmark: university.name,
    target_lat: university.lat,
    target_lng: university.lng,
    keywords: stripProximityStopWords(filters.keywords),
  };
}

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
  landmark: z.string().nullable(), // Thêm trường landmark
});

export type RoomSearchFilter = z.infer<typeof roomSearchFilterSchema> & {
  target_lat?: number | null;
  target_lng?: number | null;
};

const EMPTY_FILTER: RoomSearchFilter = {
  district_name: null,
  room_type: null,
  price_min: null,
  price_max: null,
  area_min: null,
  area_max: null,
  keywords: null,
  landmark: null,
  target_lat: null,
  target_lng: null,
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
  if (!q) return { ...EMPTY_FILTER };

  const filters: RoomSearchFilter = { ...EMPTY_FILTER };
  let cleanQuery = q;

  for (const { pattern, name } of DISTRICT_PATTERNS) {
    if (pattern.test(cleanQuery)) {
      filters.district_name = name;
      cleanQuery = cleanQuery.replace(pattern, "");
      break;
    }
  }

  for (const { pattern, type } of ROOM_TYPE_PATTERNS) {
    if (pattern.test(cleanQuery)) {
      filters.room_type = type;
      cleanQuery = cleanQuery.replace(pattern, "");
      break;
    }
  }

  const price = parsePriceMillion(q);
  if (price) {
    if (/dưới|duoi|tối đa|toi da|<\s*/i.test(q)) {
      filters.price_max = price;
    } else if (/trên|tren|từ|tu|>\s*/i.test(q)) {
      filters.price_min = price;
    } else {
      filters.price_max = price;
    }
    cleanQuery = cleanQuery.replace(
      /(\d+(?:[.,]\d+)?)\s*triệu|\b(\d+)\s*tr\b/i,
      "",
    );
    cleanQuery = cleanQuery.replace(
      /dưới|duoi|tối đa|toi da|<|trên|tren|từ|tu|>/gi,
      "",
    );
  }

  const areaMatch = q.match(/(\d+)\s*m²|(\d+)\s*m2/i);
  if (areaMatch) {
    const area = Number(areaMatch[1] || areaMatch[2]);
    if (/trên|tren|>\s*/i.test(q)) filters.area_min = area;
    else if (/dưới|duoi|<\s*/i.test(q)) filters.area_max = area;
    else filters.area_min = area;
    cleanQuery = cleanQuery.replace(/(\d+)\s*m²|(\d+)\s*m2/i, "");
  }

  const landmarkHint = extractLandmarkFromQuery(q);
  if (landmarkHint) {
    const university = resolveUniversity(landmarkHint);
    if (university) {
      return applyUniversityToFilters(filters, university);
    }
  }

  cleanQuery = cleanQuery.replace(
    /(tìm|cần tìm|thuê|cho thuê|phòng trọ|phòng|ở|đường|tại|khu vực|gần|gan|near|cạnh|canh)\s*/gi,
    " ",
  );
  cleanQuery = cleanQuery.replace(/\s+/g, " ").trim();
  filters.keywords = cleanQuery || null;

  return filters;
}

const SYSTEM_PROMPT = `Bạn là trợ lý phân tích câu tìm kiếm phòng trọ tại Việt Nam.
Nhiệm vụ: chuyển câu tìm kiếm tự nhiên của người dùng thành bộ lọc JSON.

QUY TẮC:
- Chỉ trả về JSON thuần, không markdown, không giải thích.
- KHÔNG bao gồm latitude, longitude hay bất kỳ tọa độ nào.
- district_name: tên quận/huyện (vd: "Quận 1") hoặc null.
- room_type: một trong PHONG_TRO | CAN_HO_MINI | KTX | NGUYEN_CAN hoặc null.
- price_min, price_max: số VNĐ/tháng (vd: "3 triệu" = 3000000) hoặc null.
- area_min, area_max: diện tích m² hoặc null.
- keywords: từ khóa còn lại hoặc null.
- landmark: Tên địa danh hoặc trường đại học. 
  ĐẶC BIỆT LƯU Ý: Nếu người dùng tìm gần trường đại học (kể cả dùng từ lóng, viết tắt tiếng Anh/Việt như hcmus, khtn, hust, ueh, bku...), bạn PHẢI dịch và chuẩn hóa nó về đúng tên đầy đủ. 
  Ví dụ: 
  - "hcmus", "khtn", "khoa học tự nhiên" -> "Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM (Cơ sở Nguyễn Văn Cừ)"
  - "hust", "bách khoa hn" -> "Đại học Bách khoa Hà Nội"
  - "bách khoa hcm", "hcmut" -> "Đại học Bách khoa TP.HCM (Cơ sở Lý Thường Kiệt)"
  Nếu không có địa danh, trả về null.

Schema JSON:
{
  "district_name": string | null,
  "room_type": "PHONG_TRO" | "CAN_HO_MINI" | "KTX" | "NGUYEN_CAN" | null,
  "price_min": number | null,
  "price_max": number | null,
  "area_min": number | null,
  "area_max": number | null,
  "keywords": string | null,
  "landmark": string | null
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

    const parsed = roomSearchFilterSchema.parse(
      extractJson(result.response.text()),
    );
    const finalFilters: RoomSearchFilter = {
      ...parsed,
      target_lat: null,
      target_lng: null,
    };

    let university =
      (parsed.landmark ? resolveUniversity(parsed.landmark) : null) ??
      (() => {
        const fromQuery = extractLandmarkFromQuery(query);
        return fromQuery ? resolveUniversity(fromQuery) : null;
      })();

    if (university) {
      return applyUniversityToFilters(finalFilters, university);
    }

    if (parsed.landmark) {
      finalFilters.keywords = finalFilters.keywords
        ? `${finalFilters.keywords} ${parsed.landmark}`
        : parsed.landmark;
    }

    return finalFilters;
  } catch (error) {
    return parseSearchQueryFallback(query);
  }
}
