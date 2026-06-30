import { Router } from "express";
import { db } from "../db";
import { roomListings, listingImages, listingAmenities, profiles, wards, districts, amenities, reviews } from "../db/schema";
import { eq, inArray } from "drizzle-orm";

const router = Router();

// GET /api/rooms - Get all rooms
router.get("/", async (req, res) => {
  try {
    const roomsQuery = await db.select({
      room: roomListings,
      wardName: wards.name,
      districtName: districts.name,
    })
    .from(roomListings)
    .leftJoin(wards, eq(roomListings.wardId, wards.id))
    .leftJoin(districts, eq(wards.districtId, districts.id));
    
    if (roomsQuery.length === 0) {
      return res.status(200).json([]);
    }

    const roomIds = roomsQuery.map(r => r.room.id);

    // Fetch images
    const images = await db.select().from(listingImages).where(inArray(listingImages.listingId, roomIds));
    
    // Fetch amenities
    const amenitiesData = await db.select().from(listingAmenities).where(inArray(listingAmenities.listingId, roomIds));

    // Combine
    const formattedRooms = roomsQuery.map(row => {
      const room = row.room;
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
        district_name: row.districtName || '',
        ward_name: row.wardName || ''
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

    const roomRows = await db.select({
      room: roomListings,
      wardName: wards.name,
      districtName: districts.name,
      landlord: profiles
    })
    .from(roomListings)
    .leftJoin(wards, eq(roomListings.wardId, wards.id))
    .leftJoin(districts, eq(wards.districtId, districts.id))
    .leftJoin(profiles, eq(roomListings.landlordId, profiles.id))
    .where(eq(roomListings.id, roomId));

    const row = roomRows[0];
    if (!row) {
      return res.status(404).json({ error: "Room not found" });
    }

    const { room, wardName, districtName, landlord } = row;

    // Fetch images
    const images = await db.select().from(listingImages).where(eq(listingImages.listingId, roomId));
    
    // Fetch amenities with details
    const amenitiesData = await db.select({
      id: amenities.id,
      name: amenities.name,
      icon: amenities.icon
    })
    .from(listingAmenities)
    .innerJoin(amenities, eq(listingAmenities.amenityId, amenities.id))
    .where(eq(listingAmenities.listingId, roomId));

    // Fetch listing reviews
    const listingReviews = await db.select({
      id: reviews.id,
      reviewer_id: reviews.reviewerId,
      reviewer_name: profiles.fullName,
      reviewer_avatar: profiles.avatarUrl,
      rating: reviews.rating,
      comment: reviews.comment,
      created_at: reviews.createdAt
    })
    .from(reviews)
    .leftJoin(profiles, eq(reviews.reviewerId, profiles.id))
    .where(eq(reviews.listingId, roomId));

    // Fetch landlord reviews
    let landlordReviews: any[] = [];
    if (landlord) {
      landlordReviews = await db.select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        reviewer_name: profiles.fullName
      })
      .from(reviews)
      .leftJoin(profiles, eq(reviews.reviewerId, profiles.id))
      .where(eq(reviews.revieweeId, landlord.id));
    }

    // Origin/main fetched landlordProfile here, but we already joined landlord above so we can remove this block.

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
      amenity_ids: amenitiesData.map(am => am.id),
      district_name: districtName || '',
      ward_name: wardName || '',
      
      // Fully populated objects for the detail page
      landlord: landlord ? {
        id: landlord.id,
        full_name: landlord.fullName,
        avatar_url: landlord.avatarUrl,
        email: landlord.email, // Added from origin/main
        phone: landlord.phone,
        is_verified: landlord.isVerified,
        created_at: landlord.createdAt
      } : null,
      amenities: amenitiesData,
      reviews: listingReviews,
      landlordReviews: landlordReviews
    };

    return res.status(200).json(formattedRoom);
  } catch (error) {
    console.error("Error fetching room:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


async function deleteStorageFiles(paths: string[]) {
  const promises = paths.map(path =>
    fetch(
      `${process.env.SUPABASE_URL}/storage/v1/object/listing-images/${path}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        },
      }
    )
  );

  await Promise.all(promises);
}

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  try {
    // 1. get images
    const images = await db
      .select()
      .from(listingImages)
      .where(eq(listingImages.listingId, id));

    const paths = images
      .map(i => i.imagePath)
      .filter((p): p is string => typeof p === 'string');

    // 2. delete storage
    if (paths.length > 0) {
      await deleteStorageFiles(paths);
    }

    // 3. delete DB images
    await db.delete(listingImages)
      .where(eq(listingImages.listingId, id));

    // 4. delete listing
    await db.delete(roomListings)
      .where(eq(roomListings.id, id));

    return res.json({ success: true });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Delete failed' });
  }
});

export default router;
