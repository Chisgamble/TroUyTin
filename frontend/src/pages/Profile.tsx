import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getProfile, updateProfile, uploadAvatar, type Profile } from '../services/profiles'
import {
  User, Heart, Building2, Settings, Camera,
  CheckCircle2, ChevronRight, Shield, CreditCard,
  Pencil, Loader2, AlertCircle, Check, MessageCircle
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileFormValues = {
  fullName: string
  phone: string
  bio: string
  role: 'TENANT' | 'LANDLORD'
}

type SidebarItem = {
  key: string
  label: string
  icon: React.ElementType
  landlordOnly?: boolean
  path: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  TENANT: 'Người đi thuê',
  LANDLORD: 'Chủ cho thuê',
  ADMIN: 'Quản trị viên',
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: 'profile', label: 'Thông tin cá nhân', icon: User, path: '/profile' },
  { key: 'listings', label: 'Phòng cho thuê', icon: Building2, landlordOnly: true, path: '/profile/listings' },
  { key: 'saved-rooms', label: 'Phòng đã lưu', icon: Heart, path: '/profile/saved-rooms' },
  { key: 'saved-profiles', label: 'Hồ sơ đã lưu', icon: User, path: '/profile/saved-profiles' },
  { key: 'messages', label: 'Tin nhắn', icon: MessageCircle, path: '/chat' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatJoinDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`
}

function DefaultAvatar({ name, size = 'lg' }: { name: string; size?: 'sm' | 'lg' }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
    : '?'
  const textSize = size === 'lg' ? 'text-3xl' : 'text-sm'
  return (
    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white ${textSize} font-bold select-none`}>
      {initials}
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ profile, activeKey }: { profile: Profile | null; activeKey: string }) {
  const navigate = useNavigate()

  const visibleItems = SIDEBAR_ITEMS.filter(item =>
    !item.landlordOnly || profile?.role === 'LANDLORD'
  )

  return (
    <aside className="w-56 shrink-0 pt-10">
      <nav className="space-y-0.5">
        {visibleItems.map(item => {
          const Icon = item.icon
          const active = activeKey === item.key
          return (
            <button
              key={item.key}
              onClick={() => item.key !== 'profile' && navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>()

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getProfile(user.id)
      .then(p => {
        setProfile(p)
        if (p) {
          reset({
            fullName: p.fullName ?? '',
            phone: p.phone ?? '',
            bio: p.bio ?? '',
            role: p.role === 'ADMIN' ? 'TENANT' : p.role,
          })
        }
      })
      .catch(() => setErrorMsg('Không thể tải hồ sơ. Vui lòng thử lại.'))
      .finally(() => setLoading(false))
  }, [user, reset])

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return
    setSaving(true)
    setSuccessMsg('')
    setErrorMsg('')
    try {
      const updated = await updateProfile(user.id, values)
      setProfile(updated)
      reset({
        fullName: updated.fullName ?? '',
        phone: updated.phone ?? '',
        bio: updated.bio ?? '',
        role: updated.role === 'ADMIN' ? 'TENANT' : updated.role,
      })
      setSuccessMsg('Đã lưu thay đổi thành công!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch {
      setErrorMsg('Lưu thất bại. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Chỉ chấp nhận file JPG, PNG hoặc WebP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Ảnh không được vượt quá 2MB.')
      return
    }

    setUploadingAvatar(true)
    setErrorMsg('')
    try {
      const url = await uploadAvatar(user.id, file)
      setProfile(prev => prev ? { ...prev, avatarUrl: url } : prev)
      setSuccessMsg('Đã cập nhật ảnh đại diện!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch {
      setErrorMsg('Tải ảnh lên thất bại. Vui lòng thử lại.')
    } finally {
      setUploadingAvatar(false)
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm">Đang tải hồ sơ...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Không tìm thấy hồ sơ.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Layout wrapper ── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-6 items-start">

          {/* ── Sidebar ── */}
          <Sidebar profile={profile} activeKey="profile" />

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Cover + Avatar header card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Cover photo */}
              <div className="h-36 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 relative">
                {/* <button className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/30 hover:bg-black/50 text-white text-xs font-medium rounded-lg backdrop-blur-sm transition-all">
                  <Camera className="w-3.5 h-3.5" />
                  Chỉnh sửa ảnh bìa
                </button> */}
              </div>

              {/* Avatar row */}
              <div className="px-6 pb-5">
                <div className="flex items-end gap-4 -mt-12 mb-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt={profile.fullName ?? 'Avatar'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <DefaultAvatar name={profile.fullName ?? profile.email ?? ''} />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0.5 right-0.5 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow transition-colors disabled:opacity-60"
                    >
                      {uploadingAvatar
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Pencil className="w-3.5 h-3.5" />
                      }
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>

                  {/* Name + meta */}
                  <div className="pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-lg font-bold text-slate-900">
                        {profile.fullName || profile.username || 'Chưa cập nhật tên'}
                      </h1>
                      {profile.isVerified && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Đã xác minh
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gia nhập từ {formatJoinDate(profile.createdAt)}
                      {' · '}
                      {ROLE_LABELS[profile.role] ?? profile.role}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {successMsg && (
              <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
                <Check className="w-4 h-4 shrink-0" />
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Form card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-slate-800">Thông tin cá nhân</h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Row 1: Full name + Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Họ và tên" error={errors.fullName?.message}>
                    <input
                      type="text"
                      {...register('fullName', { required: 'Vui lòng nhập họ và tên' })}
                      placeholder="Nguyễn Văn A"
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Số điện thoại" error={errors.phone?.message}>
                    <input
                      type="tel"
                      {...register('phone', {
                        pattern: { value: /^[0-9]{9,11}$/, message: 'Số điện thoại không hợp lệ' },
                      })}
                      placeholder="090 123 4567"
                      className={inputCls}
                    />
                  </FormField>
                </div>

                {/* Row 2: Email (read-only) + Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Email" hint="Không thể thay đổi">
                    <input
                      type="email"
                      value={profile.email ?? ''}
                      disabled
                      className={inputCls + ' opacity-60 cursor-not-allowed'}
                    />
                  </FormField>
                  <FormField label="Vai trò">
                    <div className="relative">
                      <select
                        {...register('role')}
                        className={inputCls + ' appearance-none pr-8'}
                      >
                        <option value="TENANT">Người đi thuê</option>
                        <option value="LANDLORD">Chủ cho thuê</option>
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </FormField>
                </div>

                {/* Bio */}
                <FormField label="Giới thiệu bản thân" error={errors.bio?.message}>
                  <textarea
                    {...register('bio', { maxLength: { value: 300, message: 'Tối đa 300 ký tự' } })}
                    rows={3}
                    placeholder="Mô tả ngắn về bản thân, thói quen sinh hoạt, yêu cầu khi ở ghép..."
                    className={inputCls + ' resize-none'}
                  />
                </FormField>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={saving || !isDirty}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputCls =
  'w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder-slate-400 text-slate-900'

function FormField({
  label, hint, error, children,
}: {
  label: string; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {hint && <span className="ml-2 text-xs font-normal text-slate-400">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  )
}

function TileButton({
  icon, iconBg, title, subtitle,
}: {
  icon: React.ReactNode; iconBg: string; title: string; subtitle: string
}) {
  return (
    <button
      type="button"
      className="flex items-center justify-between px-5 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group text-left"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
    </button>
  )
}