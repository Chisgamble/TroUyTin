import type { RoomType } from "../types";

export function formatPriceVND(price: number): string {
  return price.toLocaleString("vi-VN");
}

export function getRoomTypeLabel(type: RoomType | string): string {
  switch (type) {
    case "PHONG_TRO":
      return "Phòng trọ";
    case "CAN_HO_MINI":
      return "Căn hộ mini";
    case "KTX":
      return "KTX";
    case "NGUYEN_CAN":
      return "Nguyên căn";
    default:
      return "Phòng";
  }
}
