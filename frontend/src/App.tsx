import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { 
  Home, 
  Login, 
  Profile, 
  RoommateOnboarding, 
  RoommateMatching, 
  SavedRoommates, 
  RoommatePostCreate, 
  RoommatePostList 
} from './pages'
import { TestReview } from './pages/TestReview'
import { Chat } from './pages/Chat'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Import các trang mới từ nhánh main của bạn cùng nhóm
import MainLayout from './components/Layout/MainLayout'
import HomePage from './pages/HomePage'
import ListingDetailPage from './pages/ListingDetailPage'
import SearchResultsPage from './pages/SearchResultsPage'
import ResetPassword from './pages/ResetPassword'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Đang đồng bộ hóa phiên đăng nhập...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ==========================================
            1. AUTHENTICATION ROUTES (KHÔNG BỌC LAYOUT)
           ========================================== */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ==========================================
            2. ROOMMATE MATCHING MODULE (CẦN CHECK AUTH)
           ========================================== */}
        <Route path="/roommate-onboarding" element={user ? <RoommateOnboarding /> : <Navigate to="/login" />} />
        <Route path="/roommate-matching" element={user ? <RoommateMatching /> : <Navigate to="/login" />} />
        <Route path="/saved-roommates" element={user ? <SavedRoommates /> : <Navigate to="/login" />} />
        
        {/* Roommate Post CRUD */}
        <Route path="/roommate-posts" element={user ? <RoommatePostList /> : <Navigate to="/login" />} />
        <Route path="/roommate-posts/create" element={user ? <RoommatePostCreate /> : <Navigate to="/login" />} />
        <Route path="/roommate-posts/:postId/edit" element={user ? <RoommatePostCreate /> : <Navigate to="/login" />} />

        {/* ==========================================
            3. CORE DỰ ÁN BỌC TRONG MAIN LAYOUT CHUNG
           ========================================== */}
        <Route element={<MainLayout />}>
          {/* Trang chủ: Nếu chưa đăng nhập thì xem HomePage công khai, đăng nhập rồi xem bản DashHome */}
          <Route path="/" element={user ? <Home /> : <HomePage />} />
          
          {/* Các trang tìm kiếm phòng trọ của bạn nhóm */}
          <Route path="/tim-kiem" element={<SearchResultsPage />} />
          <Route path="/phong/:id" element={<ListingDetailPage />} />
          
          {/* Hồ sơ & Trò chuyện cá nhân */}
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/chat" element={user ? <Chat /> : <Navigate to="/login" />} />
          
          {/* Sandbox Test */}
          <Route path="/test-review" element={<TestReview />} />
        </Route>

        {/* Fallback Route: Tự động đá về trang chủ nếu gõ bậy URL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}