import { useNavigate, useLocation } from 'react-router-dom'
import type { Profile } from '../../services/profiles'
import {
  User, Heart, Building2, MessageCircle, User2, BadgeCheck
} from 'lucide-react'

type SidebarItem = {
  key: string
  label: string
  icon: React.ElementType
  landlordOnly?: boolean
  path: string
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: 'profile', label: 'Thông tin cá nhân', icon: User, path: '/profile' },
  { key: 'listings', label: 'Phòng cho thuê', icon: Building2, landlordOnly: true, path: '/profile/listings' },
  { key: 'saved-rooms', label: 'Phòng đã lưu', icon: Heart, path: '/profile/saved-rooms' },
  { key: 'messages', label: 'Tin nhắn', icon: MessageCircle, path: '/chat' },
  { key: 'saved-roommates', label: 'Người ở ghép đã lưu', icon: User2, path: '/saved-roommates' },
]

function DefaultAvatar({ name }: { name: string }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
    : '?'
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-bold select-none">
      {initials}
    </div>
  )
}

export default function ProfileSidebar({
  profile,
}: {
  profile: Profile | null
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const visibleItems = SIDEBAR_ITEMS.filter(
    item => !item.landlordOnly || profile?.role === 'LANDLORD' || profile?.role === 'ADMIN'
  )

  const displayName = profile?.fullName || profile?.username || 'Người dùng'

  return (
    <aside className="w-56 shrink-0">
      {/* ── User mini card ── */}
      {profile && (
        <div className="mb-5 px-3 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 text-center">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-white shrink-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <DefaultAvatar name={displayName} />
            )}
          </div>

          {/* Name + verified badge */}
          <div>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-slate-800 leading-tight line-clamp-1">
                {displayName}
              </span>
              {profile.isVerified && (
                <BadgeCheck
                  className="text-blue-500 shrink-0"
                  size={16}
                  strokeWidth={2.5}
                  aria-label="Đã xác thực"
                />
              )}
            </div>
            {profile.isVerified && (
              <p className="text-[10px] text-blue-500 font-medium mt-0.5">Đã xác thực</p>
            )}
          </div>
        </div>
      )}

      {/* ── Nav items ── */}
      <nav className="space-y-1">
        {visibleItems.map(item => {
          const Icon = item.icon
          const active = location.pathname === item.path

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition text-left
                ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}