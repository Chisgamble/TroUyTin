import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MapPin } from 'lucide-react'
import { useOutletContext } from 'react-router-dom';

import ProfileLayout from '../components/Layout/ProfileLayout'

import { useAuth } from '../contexts/AuthContext'
import {
  getSavedListings,
  unsaveListing,
  type RoomListing,
} from '../services/roomListing'
import { type Profile } from '../services/profiles';

export default function SavedRoomListing() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const profile = useOutletContext<Profile>();

  const {
    data: listings = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['saved-listings', user?.id],
    queryFn: () => getSavedListings(user!.id),
    enabled: !!user?.id,
  })

  const unsaveMutation = useMutation({
    mutationFn: (listingId: number) =>
      unsaveListing(user!.id, listingId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['saved-listings', user?.id],
      })
    },
  })

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN').format(price) + ' đ'

  if (isLoading) {
    return (
      <div className="p-6 text-gray-500">
        Đang tải danh sách đã lưu...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 text-red-500">
        Không thể tải dữ liệu. Thử lại sau.
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="p-6 text-gray-500">
        Bạn chưa lưu phòng nào.
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
        <Heart className="text-red-500" size={20} />
        Phòng đã lưu
      </h1>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((item: RoomListing) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition"
          >
            {/* Image */}
            <div className="h-40 bg-gray-100 relative">
              {item.imageUrls?.[0] ? (
                <img
                  src={item.imageUrls[0]}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Không có ảnh
                </div>
              )}

              {/* toggle unsave */}
              <button
                onClick={() => unsaveMutation.mutate(item.id)}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-500 p-2 rounded-full shadow transition hover:scale-105"
              >
                <Heart size={16} fill="currentColor" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-2">
              <h2 className="font-semibold text-gray-800 line-clamp-1">
                {item.title}
              </h2>

              <p className="text-brand-600 font-semibold">
                {formatPrice(item.price)} / tháng
              </p>

              <div className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin size={14} />
                <span className="line-clamp-1">
                  {item.addressDetail ||
                    item.districtName ||
                    'Không rõ địa chỉ'}
                </span>
              </div>

              <div className="flex gap-2 text-xs text-gray-500">
                <span className="px-2 py-1 bg-gray-100 rounded-md">
                  {item.area} m²
                </span>
                <span className="px-2 py-1 bg-gray-100 rounded-md">
                  {item.roomType}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}