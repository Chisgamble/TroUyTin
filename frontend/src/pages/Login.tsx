import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp, resetPassword, signInWithGoogle } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'

type AuthMode = 'login' | 'signup' | 'forgot';

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', content: '' }) // type: 'success' | 'error'
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  const translateError = (errMessage: string) => {
    if (errMessage.includes('Invalid login credentials')) {
      return 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
    }
    if (errMessage.includes('Email not confirmed') || errMessage.includes('User not confirmed')) {
      return 'Địa chỉ email chưa được xác nhận. Vui lòng kiểm tra hộp thư để kích hoạt tài khoản.';
    }
    if (errMessage.includes('User already registered') || errMessage.includes('already exists')) {
      return 'Email này đã đăng ký tài khoản khác. Vui lòng sử dụng email khác.';
    }
    if (errMessage.includes('Password should be at least')) {
      return 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.';
    }
    if (errMessage.includes('Signup requires a valid email')) {
      return 'Vui lòng cung cấp địa chỉ email hợp lệ.';
    }
    return errMessage;
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage({ type: '', content: '' })

    // Validations
    if (!email) {
      setMessage({ type: 'error', content: 'Vui lòng nhập địa chỉ email.' })
      return
    }

    if (mode !== 'forgot' && !password) {
      setMessage({ type: 'error', content: 'Vui lòng nhập mật khẩu.' })
      return
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setMessage({ type: 'error', content: 'Mật khẩu xác nhận không khớp.' })
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
        await refreshUser()
        navigate('/')
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password)
        if (error) throw error
        setMessage({
          type: 'success',
          content: 'Đăng ký thành công! Một email kích hoạt đã được gửi tới bạn. Vui lòng kiểm tra hộp thư.'
        })
        // Clear fields
        setPassword('')
        setConfirmPassword('')
      } else if (mode === 'forgot') {
        const redirectToUrl = `${window.location.origin}/reset-password`;
        const { error } = await resetPassword(email, redirectToUrl)
        if (error) throw error
        setMessage({
          type: 'success',
          content: 'Yêu cầu khôi phục mật khẩu đã gửi thành công! Vui lòng kiểm tra hộp thư email của bạn.'
        })
      }
    } catch (err) {
      setMessage({
        type: 'error',
        content: err instanceof Error ? translateError(err.message) : 'Đã có lỗi xảy ra. Vui lòng thử lại.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setMessage({ type: '', content: '' })
    setLoading(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) throw error
      // Supabase tự redirect sang Google, không cần navigate()
    } catch (err) {
      setMessage({
        type: 'error',
        content: err instanceof Error ? translateError(err.message) : 'Đăng nhập Google thất bại. Vui lòng thử lại.'
      })
      setLoading(false)
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setMessage({ type: '', content: '' })
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4 md:p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[640px]">

        {/* Banner Left Column - Hidden on mobile */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-blue-700 via-indigo-600 to-violet-700 p-10 flex-col justify-between relative overflow-hidden text-white">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -ml-28 -mb-28"></div>

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase border border-white/20 mb-6">
              <svg className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              Nền tảng uy tín số 1
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">TroUyTin</h1>
            <p className="mt-3 text-lg text-blue-100 font-light">
              Nền tảng tìm kiếm phòng trọ minh bạch, xác thực chủ nhà và đánh giá thực tế từ người dùng.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Chủ nhà xác thực</h3>
                <p className="text-sm text-blue-100 font-light">Mọi tài khoản cho thuê đều được kiểm duyệt danh tính rõ ràng.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.243.58 1.8l-3.97 2.88a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.97-2.88a1 1 0 00-1.176 0l-3.97 2.88c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 12.22c-.78-.557-.381-1.8.58-1.8h4.908a1 1 0 00.95-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Đánh giá trung thực</h3>
                <p className="text-sm text-blue-100 font-light">Các đánh giá từ người thuê thực tế giúp bạn có cái nhìn chính xác nhất.</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-xs text-blue-200">
            &copy; 2026 TroUyTin. Bảo lưu mọi quyền lợi.
          </div>
        </div>

        {/* Form Right Column */}
        <div className="col-span-1 md:col-span-7 flex flex-col justify-center px-6 py-12 sm:px-12 md:px-16 lg:px-20 bg-white">
          <div className="mx-auto w-full max-w-md">

            {/* Header logo for mobile */}
            <div className="flex justify-center md:hidden mb-6">
              <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                TroUyTin
              </span>
            </div>

            {/* Mode headers */}
            <div className="text-center md:text-left mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {mode === 'login' && 'Đăng nhập'}
                {mode === 'signup' && 'Tạo tài khoản mới'}
                {mode === 'forgot' && 'Khôi phục mật khẩu'}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {mode === 'login' && 'Chào mừng quay trở lại! Điền thông tin đăng nhập của bạn.'}
                {mode === 'signup' && 'Bắt đầu tìm kiếm và đánh giá phòng trọ uy tín ngay hôm nay.'}
                {mode === 'forgot' && 'Nhập email đăng ký để nhận liên kết đặt lại mật khẩu.'}
              </p>
            </div>

            {/* Alert messages */}
            {message.content && (
              <div className={`p-4 rounded-2xl mb-6 text-sm flex items-start gap-3 border ${message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                : 'bg-rose-50 text-rose-800 border-rose-100'
                }`}>
                {message.type === 'success' ? (
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                <span>{message.content}</span>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleAuthAction}>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                      Mật khẩu
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Quên mật khẩu?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password (only on SignUp) */}
              {mode === 'signup' && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.99]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  <>
                    {mode === 'login' && 'Đăng nhập'}
                    {mode === 'signup' && 'Đăng ký tài khoản'}
                    {mode === 'forgot' && 'Gửi yêu cầu khôi phục'}
                  </>
                )}
              </button>
            </form>

            {/* Footer switcher links */}
            <div className="mt-8 text-center">
              {mode === 'login' && (
                <p className="text-sm text-slate-600">
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Đăng ký ngay
                  </button>
                </p>
              )}

              {mode === 'signup' && (
                <p className="text-sm text-slate-600">
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Đăng nhập tại đây
                  </button>
                </p>
              )}

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Quay lại đăng nhập
                </button>
              )}
            </div>

              {mode !== 'forgot' && (
                  <>
                    {/* Divider */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-white text-slate-400 font-medium">Hoặc tiếp tục với</span>
                      </div>
                    </div>

                    {/* Google Button */}
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      {/* Google SVG logo */}
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Đăng nhập với Google
                    </button>
                  </>
                )}

          </div>
        </div>

      </div>
    </div>
  )
}
