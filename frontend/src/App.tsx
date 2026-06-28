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
        {/* Core Routes */}
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/chat" element={user ? <Chat /> : <Navigate to="/login" />} />
        
        {/* Roommate Matching Routes (Swipe & Discovery) */}
        <Route path="/roommate-onboarding" element={user ? <RoommateOnboarding /> : <Navigate to="/login" />} />
        <Route path="/roommate-matching" element={user ? <RoommateMatching /> : <Navigate to="/login" />} />
        <Route path="/saved-roommates" element={user ? <SavedRoommates /> : <Navigate to="/login" />} />
        
        {/* Roommate Post Routes (CRUD Phòng ở ghép) */}
        <Route path="/roommate-posts" element={user ? <RoommatePostList /> : <Navigate to="/login" />} />
        <Route path="/roommate-posts/create" element={user ? <RoommatePostCreate /> : <Navigate to="/login" />} />
        
        {/*Route chỉnh sửa bài đăng tích hợp tham số động :postId theo nốt họp */}
        <Route path="/roommate-posts/:postId/edit" element={user ? <RoommatePostCreate /> : <Navigate to="/login" />} />
        
        {/* Sandbox Test Routes */}
        <Route path="/test-review" element={<TestReview />} />

        {/* Fallback Route: Tự động đá về trang chủ nếu gõ sai URL vô tội vạ */}
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