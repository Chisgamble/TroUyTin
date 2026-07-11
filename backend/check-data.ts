import { db } from './src/db';
import { profiles, roomListings } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const allProfiles = await db.select().from(profiles);
  console.log("Profiles:");
  console.log(allProfiles.map(p => ({ id: p.id, name: p.fullName, email: p.email })));

  const allRooms = await db.select().from(roomListings);
  console.log("\nRoom Listings:");
  console.log(allRooms.map(r => ({ id: r.id, landlordId: r.landlordId })));

  process.exit(0);
}

main().catch(console.error)