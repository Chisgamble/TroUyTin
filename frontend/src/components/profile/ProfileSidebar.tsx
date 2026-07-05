import { useNavigate, useLocation } from 'react-router-dom'
import type { Profile } from '../../services/profiles'
import {
  User, Heart, Building2, MessageCircle, User2
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
  { key: 'saved-roommates', label: 'Người ở ghép đã lưu', icon: User2, path: '/saved-roommates'}
]

export default function ProfileSidebar({
  profile,
}: {
  profile: Profile | null
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const visibleItems = SIDEBAR_ITEMS.filter(
    item => !item.landlordOnly || profile?.role === 'LANDLORD'
  )

  return (
    <aside className="w-56 shrink-0 pt-10">
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