import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'
import { chatService } from '../services/chatService'
import { getListingsByLandlord, type RoomListing } from '../services/roomListing'
import { formatPriceVND } from '../utils/formatters'
import {
  BadgeCheck, Calendar, MapPin, MessageSquare,
  UserPlus, Building2, Star, ChevronLeft, ChevronRight,
  Wifi, AirVent
} from 'lucide-react'
import type { Profile, Review } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOM_TYPE_LABELS: Record<string, string> = {
  PHONG_TRO: 'Phòng trọ',
  CAN_HO_MINI: 'Căn hộ mini',
  CAN_HO: 'Căn hộ',
  NGUYEN_CAN: 'Nguyên căn',
  KTX: 'Ký túc xá',
}

const LISTINGS_PER_PAGE = 4
const REVIEWS_PER_PAGE = 5

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatJoinDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`
}

function DefaultAvatar({ name, size = 'lg' }: { name: string; size?: 'sm' | 'lg' }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
    : '?'
  const sz = size === 'lg' ? 'text-4xl w-full h-full' : 'text-base w-full h-full'
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold select-none ${sz}`}>
      {initials}
    </div>
  )
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={14}
          className={s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
        />
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [listings, setListings] = useState<RoomListing[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [chatLoading, setChatLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings')
  const [listingPage, setListingPage] = useState(1)
  const [reviewPage, setReviewPage] = useState(1)

  // ── Fetch profile + listings + reviews ──
  useEffect(() => {
    if (!userId) return
    setLoading(true)

    Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      getListingsByLandlord(userId),
      supabase
        .from('reviews')
        .select('*, reviewer:profiles(id, full_name, avatar_url)')
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false }),
    ])
      .then(([profileRes, listingsData, reviewsRes]) => {
        if (profileRes.data) {
          const d = profileRes.data
          setProfile({
            id: d.id,
            email: d.email,
            full_name: d.full_name,
            avatar_url: d.avatar_url,
            role: d.role,
            is_verified: d.is_verified,
            is_active: d.is_active,
            bio: d.bio,
            created_at: d.created_at,
          })
        }
        setListings(listingsData.filter(l => l.status === 'AVAILABLE'))
        if (reviewsRes.data) setReviews(reviewsRes.data as Review[])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [userId])

  const handleChat = async () => {
    if (!user) { navigate('/login'); return }
    if (!userId) return
    setChatLoading(true)
    try {
      const conv = await chatService.getOrCreateConversation(user.id, userId)
      navigate('/chat', { state: { conversationId: conv.id } })
    } catch (e) {
      console.error(e)
    } finally {
      setChatLoading(false)
    }
  }

  // ── Derived ──
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const totalListingPages = Math.max(1, Math.ceil(listings.length / LISTINGS_PER_PAGE))
  const paginatedListings = listings.slice(
    (listingPage - 1) * LISTINGS_PER_PAGE,
    listingPage * LISTINGS_PER_PAGE
  )

  const totalReviewPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PER_PAGE))
  const paginatedReviews = reviews.slice(
    (reviewPage - 1) * REVIEWS_PER_PAGE,
    reviewPage * REVIEWS_PER_PAGE
  )

  const displayName = profile?.full_name || 'Người dùng'
  const isOwn = user?.id === userId

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Đang tải hồ sơ...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Không tìm thấy người dùng này.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Hero card ── */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

          {/* Banner */}
          <div className="h-44 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 relative" />

          {/* Avatar + info row */}
          <div className="px-6 pb-6 relative">
            {/* Avatar */}
            <div className="absolute -top-12 left-6 w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <DefaultAvatar name={displayName} />
              )}
            </div>

            {/* Actions — top right */}
            {!isOwn && (
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={handleChat}
                  disabled={chatLoading}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-sm disabled:opacity-60"
                >
                  <MessageSquare size={16} />
                  {chatLoading ? 'Đang mở...' : 'Chat ngay'}
                </button>
                <button className="inline-flex items-center gap-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-semibold px-5 py-2.5 rounded-xl transition">
                  <UserPlus size={16} />
                  Theo dõi
                </button>
              </div>
            )}
            {isOwn && (
              <div className="flex justify-end pt-4">
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium px-4 py-2 rounded-xl transition"
                >
                  Chỉnh sửa hồ sơ
                </Link>
              </div>
            )}

            {/* Name + verified */}
            <div className="mt-10">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{displayName}</h1>
                {profile.is_verified && (
                  <BadgeCheck className="text-blue-500 shrink-0" size={22} strokeWidth={2.5} />
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <Calendar size={13} />
                Tham gia từ {formatJoinDate(profile.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-4xl mx-auto px-4 pb-16 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">

        {/* Left sidebar */}
        <aside className="space-y-4">

          {/* Giới thiệu */}
          {profile.bio && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-2">Giới thiệu</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Stats */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Building2 size={16} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{listings.length} tin đăng</p>
                <p className="text-xs text-slate-400">đang hoạt động</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Star size={16} className="text-amber-400 fill-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {reviews.length > 0 ? avgRating.toFixed(1) : '—'} / 5
                </p>
                <p className="text-xs text-slate-400">{reviews.length} đánh giá</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="space-y-4">

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex border-b border-slate-100 px-4">
              {[
                { key: 'listings', label: `Tin đang đăng (${listings.length})` },
                { key: 'reviews', label: `Đánh giá (${reviews.length})` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'listings' | 'reviews')}
                  className={`px-4 py-4 text-sm font-semibold border-b-2 transition -mb-px ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5">

              {/* ── Tab: Listings ── */}
              {activeTab === 'listings' && (
                <>
                  {listings.length === 0 ? (
                    <div className="flex flex-col items-center py-12 gap-3 text-slate-400">
                      <Building2 size={40} className="text-slate-200" />
                      <p className="text-sm">Chưa có tin đăng nào đang hoạt động.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {paginatedListings.map(item => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition group cursor-pointer"
                            onClick={() => navigate(`/phong/${item.id}`)}
                          >
                            {/* Image */}
                            <div className="h-40 bg-slate-100 relative overflow-hidden">
                              {item.imageUrls?.[0] ? (
                                <img
                                  src={item.imageUrls[0]}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <Building2 size={32} />
                                </div>
                              )}
                              {item.isVerified && (
                                <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <BadgeCheck size={11} /> Đã xác minh
                                </span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="p-3 space-y-1.5">
                              <p className="text-blue-600 font-bold text-sm">
                                {formatPriceVND(item.price)}/tháng
                              </p>
                              <h3 className="text-sm font-semibold text-slate-800 line-clamp-1">
                                {item.title}
                              </h3>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <MapPin size={11} />
                                <span className="line-clamp-1">
                                  {item.districtName || item.addressDetail || 'Không rõ địa chỉ'}
                                </span>
                              </div>
                              {/* Amenities preview */}
                              {item.amenities && item.amenities.length > 0 && (
                                <div className="flex gap-2 text-xs text-slate-500 flex-wrap pt-0.5">
                                  {item.amenities.slice(0, 3).map(a => (
                                    <span key={a.id} className="flex items-center gap-0.5">
                                      <span>{a.icon ?? '•'}</span>
                                      {a.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-2 text-xs text-slate-400 pt-0.5">
                                <span className="px-2 py-0.5 bg-slate-100 rounded-md">{item.area} m²</span>
                                <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                                  {ROOM_TYPE_LABELS[item.roomType] ?? item.roomType}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalListingPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-5">
                          <button
                            onClick={() => setListingPage(p => Math.max(1, p - 1))}
                            disabled={listingPage === 1}
                            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition"
                          >
                            <ChevronLeft size={15} />
                          </button>
                          {Array.from({ length: totalListingPages }, (_, i) => i + 1).map(p => (
                            <button
                              key={p}
                              onClick={() => setListingPage(p)}
                              className={`w-8 h-8 rounded-lg text-sm font-semibold transition ${
                                p === listingPage
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                          <button
                            onClick={() => setListingPage(p => Math.min(totalListingPages, p + 1))}
                            disabled={listingPage === totalListingPages}
                            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition"
                          >
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      )}

                      {listings.length > LISTINGS_PER_PAGE && (
                        <p className="text-center text-xs text-slate-400 mt-2">
                          Hiển thị {Math.min((listingPage - 1) * LISTINGS_PER_PAGE + 1, listings.length)}–{Math.min(listingPage * LISTINGS_PER_PAGE, listings.length)} / {listings.length} tin
                        </p>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ── Tab: Reviews ── */}
              {activeTab === 'reviews' && (
                <>
                  {reviews.length === 0 ? (
                    <div className="flex flex-col items-center py-12 gap-3 text-slate-400">
                      <Star size={40} className="text-slate-200" />
                      <p className="text-sm">Chưa có đánh giá nào.</p>
                    </div>
                  ) : (
                    <>
                      {/* Avg score */}
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl mb-4">
                        <p className="text-4xl font-bold text-slate-800">{avgRating.toFixed(1)}</p>
                        <div>
                          <StarDisplay rating={avgRating} />
                          <p className="text-xs text-slate-500 mt-1">{reviews.length} đánh giá</p>
                        </div>
                      </div>

                      {/* Review list */}
                      <div className="space-y-4">
                        {paginatedReviews.map(review => (
                          <div key={review.id} className="flex gap-3">
                            {/* Reviewer avatar */}
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0">
                              {review.reviewer?.avatar_url ? (
                                <img
                                  src={review.reviewer.avatar_url}
                                  alt={review.reviewer.full_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <DefaultAvatar name={review.reviewer?.full_name ?? '?'} size="sm" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-slate-800">
                                  {review.reviewer?.full_name ?? 'Người dùng ẩn danh'}
                                </p>
                                <StarDisplay rating={review.rating} />
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {new Date(review.created_at).toLocaleDateString('vi-VN')}
                              </p>
                              {review.comment && (
                                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                  {review.comment}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Review Pagination */}
                      {totalReviewPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-5">
                          <button
                            onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                            disabled={reviewPage === 1}
                            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition"
                          >
                            <ChevronLeft size={15} />
                          </button>
                          {Array.from({ length: totalReviewPages }, (_, i) => i + 1).map(p => (
                            <button
                              key={p}
                              onClick={() => setReviewPage(p)}
                              className={`w-8 h-8 rounded-lg text-sm font-semibold transition ${
                                p === reviewPage
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                          <button
                            onClick={() => setReviewPage(p => Math.min(totalReviewPages, p + 1))}
                            disabled={reviewPage === totalReviewPages}
                            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition"
                          >
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
