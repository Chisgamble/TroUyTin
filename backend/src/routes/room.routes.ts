import { Router } from "express";
import { db } from "../db";
import { roomListings, listingImages, listingAmenities, profiles } from "../db/schema";
import { eq, inArray } from "drizzle-orm";

const router = Router();

// GET /api/rooms - Get all rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await db.select().from(roomListings);
    
    if (rooms.length === 0) {
      return res.status(200).json([]);
    }

    const roomIds = rooms.map(r => r.id);

    // Fetch images
    const images = await db.select().from(listingImages).where(inArray(listingImages.listingId, roomIds));
    
    // Fetch amenities
    const amenitiesData = await db.select().from(listingAmenities).where(inArray(listingAmenities.listingId, roomIds));

    // Combine
    const formattedRooms = rooms.map(room => {
      const roomImages = images.filter(img => img.listingId === room.id).map(img => img.imageUrl);
      const roomAmenityIds = amenitiesData.filter(am => am.listingId === room.id).map(am => am.amenityId);
      
      return {
        ...room,
        // Match the frontend mock interface:
        landlord_id: room.landlordId, // frontend expects landlord_id string now
        room_type: room.roomType,
        ward_id: room.wardId,
        address_detail: room.addressDetail,
        is_verified: room.isVerified,
        view_count: room.viewCount,
        created_at: room.createdAt,
        updated_at: room.updatedAt,
        
        images: roomImages.length > 0 ? roomImages : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'], // fallback image
        amenity_ids: roomAmenityIds,
        district_name: '', // TODO: join with districts table
        ward_name: '' // TODO: join with wards table
      };
    });

    return res.status(200).json(formattedRooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/rooms/:id - Get room by ID
router.get("/:id", async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    if (isNaN(roomId)) {
      return res.status(400).json({ error: "Invalid room ID" });
    }

    const roomRows = await db.select().from(roomListings).where(eq(roomListings.id, roomId));
    const room = roomRows[0];

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Fetch images
    const images = await db.select().from(listingImages).where(eq(listingImages.listingId, roomId));
    
    // Fetch amenities
    const amenitiesData = await db.select().from(listingAmenities).where(eq(listingAmenities.listingId, roomId));

    // Fetch landlord profile
    let landlordProfile = null;
    if (room.landlordId) {
      const profileRows = await db.select().from(profiles).where(eq(profiles.id, room.landlordId));
      if (profileRows.length > 0) {
        landlordProfile = profileRows[0];
      }
    }

    const formattedRoom = {
      ...room,
      landlord_id: room.landlordId,
      room_type: room.roomType,
      ward_id: room.wardId,
      address_detail: room.addressDetail,
      is_verified: room.isVerified,
      view_count: room.viewCount,
      created_at: room.createdAt,
      updated_at: room.updatedAt,
      
      images: images.length > 0 ? images.map(img => img.imageUrl) : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
      amenity_ids: amenitiesData.map(am => am.amenityId),
      district_name: '', // TODO: join with districts table
      ward_name: '', // TODO: join with wards table
      landlord: landlordProfile ? {
        id: landlordProfile.id,
        full_name: landlordProfile.fullName,
        avatar_url: landlordProfile.avatarUrl,
        email: landlordProfile.email,
        phone: landlordProfile.phone
      } : null
    };

    return res.status(200).json(formattedRoom);
  } catch (error) {
    console.error("Error fetching room:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
