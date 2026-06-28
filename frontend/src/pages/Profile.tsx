import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getProfile, updateProfile, uploadAvatar, type Profile } from '../services/profiles'
import { Users, Bookmark, MessageSquare, Shield, CreditCard, Camera } from 'lucide-react'

type ProfileFormValues = {
  fullName: string
  phone: string
  bio: string
  role: 'TENANT' | 'LANDLORD'
}

const ROLE_LABELS: Record<string, string> = {
  TENANT: 'Người đi thuê',
  LANDLORD: 'Chủ cho thuê',
  ADMIN: 'Quản trị viên',
}

function formatJoinDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`
}

function DefaultAvatar({ name }: { name: string }) {
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .slice(-2)
        .join('')
        .toUpperCase()
    : '?'

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-bold select-none rounded-full">
      {initials}
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
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
      .then((p) => {
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

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
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
      setProfile((prev) => prev ? { ...prev, avatarUrl: url } : prev)
      setSuccessMsg('Đã cập nhật ảnh đại diện!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch {
      setErrorMsg('Tải ảnh lên thất bại. Vui lòng thử lại.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Đang tải hồ sơ...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Không tìm thấy hồ sơ.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="h-40 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 relative" />

      <div className="max-w-2xl mx-auto px-4 pb-16">
        {/* Avatar + Name header */}
        <div className="relative -mt-16 mb-6 flex items-end gap-4">
          {/* Avatar */}
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

            {/* Edit avatar button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-1 right-1 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-sm transition-colors disabled:opacity-60"
              title="Đổi ảnh đại diện"
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

          {/* Name + badge */}
          <div className="pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">
                {profile.fullName || profile.username || 'Chưa cập nhật tên'}
              </h1>
              {profile.isVerified && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-200">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Đã xác minh
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Gia nhập từ {formatJoinDate(profile.createdAt)} · {ROLE_LABELS[profile.role] ?? profile.role}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errorMsg}
          </div>
        )}

        {/* 🚀 QUICK NAVIGATION TILES (ROOMMATE & CHAT FUNCTIONALITIES) */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tìm người ở ghép */}
          <div 
            onClick={() => navigate('/roommate-matching')}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-start gap-2 hover:border-green-300 hover:shadow-md transition cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Tìm ở ghép</p>
              <p className="text-xs text-gray-400 mt-0.5">Khám phá bạn cùng gu</p>
            </div>
          </div>

          {/* Người ở ghép đã lưu */}
          <div 
            onClick={() => navigate('/saved-roommates')}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-start gap-2 hover:border-yellow-300 hover:shadow-md transition cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600 group-hover:bg-yellow-100 transition">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Hồ sơ đã lưu</p>
              <p className="text-xs text-gray-400 mt-0.5">Danh sách đang theo dõi</p>
            </div>
          </div>

          {/* Lịch sử chat nội bộ */}
          <div 
            onClick={() => navigate('/chat')}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-start gap-2 hover:border-blue-300 hover:shadow-md transition cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Lịch sử Chat</p>
              <p className="text-xs text-gray-400 mt-0.5">Tin nhắn hệ thống</p>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Thông tin cá nhân</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Họ và tên
              </label>
              <input
                type="text"
                {...register('fullName', { required: 'Vui lòng nhập họ và tên' })}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Phone + Role row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  {...register('phone', {
                    pattern: {
                      value: /^[0-9]{9,11}$/,
                      message: 'Số điện thoại không hợp lệ',
                    },
                  })}
                  placeholder="090 123 4567"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vai trò
                </label>
                <select
                  {...register('role')}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white appearance-none"
                >
                  <option value="TENANT">Người đi thuê</option>
                  <option value="LANDLORD">Chủ cho thuê</option>
                </select>
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
                <span className="ml-2 text-xs font-normal text-gray-400">Không thể thay đổi</span>
              </label>
              <input
                type="email"
                value={profile.email ?? ''}
                disabled
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Giới thiệu bản thân
              </label>
              <textarea
                {...register('bio', { maxLength: { value: 300, message: 'Tối đa 300 ký tự' } })}
                rows={3}
                placeholder="Mô tả ngắn về bản thân, thói quen sinh hoạt, yêu cầu khi ở ghép..."
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 focus:bg-white resize-none"
              />
              {errors.bio && (
                <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>
              )}
            </div>

            {/* Submit */}
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
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
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
            <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}