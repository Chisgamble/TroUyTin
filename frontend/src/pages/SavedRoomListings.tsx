import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import { useAuth } from '../contexts/AuthContext';
import {
  getSavedListingIds,
  getSavedListings,
  saveListing,
  unsaveListing,
} from "../services/roomListing";
import type { RoomListing } from "../services/roomListing";

export default function SavedRoomListings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState<RoomListing[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. fetch saved listings from backend
    useEffect(() => {
        if (!user) return;

        const fetchSaved = async () => {
            try {
            setLoading(true);

            const [ids, listings] = await Promise.all([
                getSavedListingIds(user.id),
                getSavedListings(user.id),
            ]);

            setSavedIds(ids);
            setListings(listings);
            } catch (err) {
            console.error(err);
            } finally {
            setLoading(false);
            }
        };

        fetchSaved();
        }, [user]);

  // toggle save (optimistic UI)
    const toggleSave = async (id: number) => {
        if (!user) return;

        const isSaved = savedIds.includes(id);

        setSavedIds(prev =>
            isSaved ? prev.filter(x => x !== id) : [...prev, id]
        );

        try {
            if (isSaved) {
            await unsaveListing(user.id, id);

            // bỏ luôn khỏi danh sách
            setListings(prev => prev.filter(l => l.id !== id));
            } else {
            await saveListing(user.id, id);

            // reload để lấy dữ liệu đầy đủ
            const [ids, rooms] = await Promise.all([
                getSavedListingIds(user.id),
                getSavedListings(user.id),
            ]);

            setSavedIds(ids);
            setListings(rooms);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!user) {
        return (
        <div style={{ padding: 24 }}>
            Vui lòng đăng nhập
        </div>
        );
    }

    if (loading) {
        return (
        <div style={{ padding: 24 }}>
            Đang tải phòng đã lưu...
        </div>
        );
    }

  return (
    <div style={{
      padding: 24,
      maxWidth: 1200,
      margin: '0 auto'
    }}>
      <h2 style={{ marginBottom: 16 }}>
        Phòng đã lưu
      </h2>

      {listings.length === 0 ? (
        <p>Bạn chưa lưu phòng nào</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16
          }}
        >
          {listings.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              saved={savedIds.includes(listing.id)}
              onToggleSave={toggleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}