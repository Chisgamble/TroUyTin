// backend/src/mocks/room.transformer.ts
import { ROOM_LISTINGS, AMENITIES } from "./mockData";

export const getFlattenedRoomsForAI = () => {
  return ROOM_LISTINGS.map((room) => {
    // variable amenity_ids (vd: [1, 2]) to string array (vd: ["Wifi", "Điều hòa"])
    const roomAmenities = AMENITIES.filter((a) =>
      room.amenity_ids.includes(a.id),
    ).map((a) => a.name);

    return {
      id: room.id,
      title: room.title,
      description: room.description,
      price: room.price,
      room_type: room.room_type,
      district: room.district_name, // Deweyz1337 đã map sẵn
      ward: room.ward_name, // Deweyz1337 đã map sẵn
      amenities: roomAmenities,
      latitude: room.latitude,
      longitude: room.longitude,
    };
  });
};
