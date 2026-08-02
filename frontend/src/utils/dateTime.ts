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
