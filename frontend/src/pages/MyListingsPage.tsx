import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getListingsByLandlord, type RoomListing } from '../services/roomListing'
import { type Profile } from '../services/profiles'
import {
  Building2, MapPin, ChevronLeft, ChevronRight,
  Eye, Clock, BadgeCheck, PlusCircle, Pencil
} from 'lucide-react'

const PAGE_SIZE = 6

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: 'Đang hiển thị', color: 'bg-emerald-100 text-emerald-700' },
  RENTED: { label: 'Đã cho thuê', color: 'bg-blue-100 text-blue-700' },
  PENDING: { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-700' },
  HIDDEN: { label: 'Đã ẩn', color: 'bg-slate-100 text-slate-500' },
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  PHONG_TRO: 'Phòng trọ',
  CAN_HO_MINI: 'Căn hộ mini',
  CAN_HO: 'Căn hộ',
  NGUYEN_CAN: 'Nguyên căn',
  KTX: 'Ký túc xá',
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default function MyListingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  // Accept outlet context same way as other profile pages
  useOutletContext<{ profile: Profile; setProfile: unknown }>()

  const {
    data: listings = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['my-listings', user?.id],
    queryFn: () => getListingsByLandlord(user!.id),
    enabled: !!user?.id,
  })

  const totalPages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE))
  const paginated = listings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Đang tải danh sách phòng...</p>
      </div>
    )
  }

  // ── Error ──
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2 text-rose-500">
        <p className="text-sm font-medium">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Building2 className="text-blue-500" size={20} />
          Phòng cho thuê của tôi
        </h1>
        <button
          onClick={() => navigate('/dang-tin')}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm"
        >
          <PlusCircle size={16} />
          Đăng tin mới
        </button>
      </div>

      {/* ── Empty state ── */}
      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Building2 size={48} className="text-slate-200" />
          <div className="text-center">
            <p className="font-medium text-slate-600">Bạn chưa đăng phòng nào</p>
            <p className="text-sm mt-1">Hãy đăng tin đầu tiên để tìm người thuê!</p>
          </div>
          <button
            onClick={() => navigate('/dang-tin')}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
          >
            <PlusCircle size={16} />
            Đăng tin ngay
          </button>
        </div>
      ) : (
        <>
          {/* ── Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((item: RoomListing) => {
              const statusInfo = STATUS_LABELS[item.status] ?? { label: item.status, color: 'bg-slate-100 text-slate-500' }
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition group"
                >
                  {/* Image */}
                  <div className="h-40 bg-gray-100 relative">
                    {item.imageUrls?.[0] ? (
                      <img
                        src={item.imageUrls[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                        <Building2 size={32} className="text-slate-200" />
                        <span className="text-xs">Không có ảnh</span>
                      </div>
                    )}

                    {/* Status badge */}
                    <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>

                    {/* Verified badge */}
                    {item.isVerified && (
                      <span className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full" title="Đã xác minh">
                        <BadgeCheck size={14} />
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <h2
                      className="font-semibold text-gray-800 line-clamp-1 cursor-pointer hover:text-blue-600 transition"
                      onClick={() => navigate(`/phong/${item.id}`)}
                    >
                      {item.title}
                    </h2>

                    <p className="text-blue-600 font-bold text-sm">
                      {formatPrice(item.price)} / tháng
                    </p>

                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin size={13} />
                      <span className="line-clamp-1">
                        {item.addressDetail || item.districtName || 'Không rõ địa chỉ'}
                      </span>
                    </div>

                    <div className="flex gap-2 text-xs text-gray-500 flex-wrap">
                      <span className="px-2 py-1 bg-gray-100 rounded-md">{item.area} m²</span>
                      <span className="px-2 py-1 bg-gray-100 rounded-md">
                        {ROOM_TYPE_LABELS[item.roomType] ?? item.roomType}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Eye size={11} />
                        {item.viewCount ?? 0} lượt xem
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => navigate(`/dang-tin?edit=${item.id}`)}
                      className="w-full mt-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition"
                    >
                      <Pencil size={13} />
                      Chỉnh sửa tin
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
                    p === page
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Count hint */}
          <p className="text-center text-xs text-slate-400">
            Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, listings.length)}–{Math.min(page * PAGE_SIZE, listings.length)} / {listings.length} phòng
          </p>
        </>
      )}
    </div>
  )
}
