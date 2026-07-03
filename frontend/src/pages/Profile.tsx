import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getProfile, updateProfile, uploadAvatar, type Profile } from '../services/profiles'
import {
  User, Heart, Building2, Settings, Camera,
  CheckCircle2, ChevronRight, Shield, CreditCard,
  Pencil, Loader2, AlertCircle, Check, MessageCircle, Users, Bookmark, MessageSquare
} from 'lucide-react'
import ProfileLayout from '../components/Layout/ProfileLayout'

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

// ─── Constants & UI Helpers ───────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  TENANT: 'Người đi thuê',
  LANDLORD: 'Chủ cho thuê',
  ADMIN: 'Quản trị viên',
}

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50";

function FormField({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="text-xs text-rose-500">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { profile, setProfile } = useOutletContext<{
    profile: Profile;
    setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  }>();

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
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="h-40 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 relative" />

      {/* Main Content Container */}
      <div className="max-w-2xl mx-auto px-4 pb-16">
        
        {/* Avatar + Name header */}
        <div className="relative -mt-16 mb-6 flex items-end gap-4">
          <div className="relative shrink-0">
            <div className="w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
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
              className="absolute bottom-1 right-1 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-sm transition-colors disabled:opacity-60"
            >
              {uploadingAvatar ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

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

        {/* Cấu trúc các khối giao diện được bọc gọn gàng */}
        <div className="space-y-6">
          
          {/* Alerts */}
          {(successMsg || errorMsg) && (
            <div className="space-y-3">
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
            </div>
          )}

          {/* 🚀 QUICK NAVIGATION TILES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div 
              onClick={() => navigate('/chat')}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-start gap-2 hover:border-blue-300 hover:shadow-md transition cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Lịch sử Chat</p>
                <p className="text-xs text-gray-400 mt-0.5">Tin nhắn trao đổi</p>
              </div>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-800">Thông tin cá nhân</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>

          {/* Account info tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between hover:border-blue-200 transition cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Bảo mật tài khoản</p>
                  <p className="text-xs text-gray-400">Xác thực 2 lớp đang bật</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between hover:border-blue-200 transition cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Phương thức thanh toán</p>
                  <p className="text-xs text-gray-400">Liên kết với MoMo, ZaloPay</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}