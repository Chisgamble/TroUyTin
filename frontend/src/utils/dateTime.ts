const UNKNOWN_UPDATED_AT = "Không rõ";

export function formatListingUpdatedAt(value?: string | null): string {
  if (!value || Number.isNaN(Date.parse(value))) {
    return UNKNOWN_UPDATED_AT;
  }

  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: false,
  }).formatToParts(new Date(value));
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  const hour = getPart("hour");
  const minute = getPart("minute");
  const day = getPart("day");
  const month = getPart("month");
  const year = getPart("year");

  if (!hour || !minute || !day || !month || !year) {
    return UNKNOWN_UPDATED_AT;
  }

  return `${hour}:${minute}, ${day}/${month}/${year}`;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const UNKNOWN_RELATIVE_UPDATED_AT = "Cập nhật: Không rõ";

export function formatListingUpdatedAgo(
  value?: string | null,
  now: Date = new Date(),
): string {
  const updatedAtMs = value ? Date.parse(value) : Number.NaN;
  const nowMs = now.getTime();

  if (Number.isNaN(updatedAtMs) || Number.isNaN(nowMs)) {
    return UNKNOWN_RELATIVE_UPDATED_AT;
  }

  const elapsedMs = Math.max(0, nowMs - updatedAtMs);

  if (elapsedMs < MINUTE_MS) {
    return "Cập nhật vừa xong";
  }

  if (elapsedMs < HOUR_MS) {
    return `Cập nhật ${Math.floor(elapsedMs / MINUTE_MS)} phút trước`;
  }

  if (elapsedMs < DAY_MS) {
    return `Cập nhật ${Math.floor(elapsedMs / HOUR_MS)} giờ trước`;
  }

  return `Cập nhật ${Math.floor(elapsedMs / DAY_MS)} ngày trước`;
}
