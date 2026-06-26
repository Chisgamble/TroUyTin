import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Home, Login, Profile } from './pages'
import { TestReview } from './pages/TestReview'
import { Chat } from './pages/Chat'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/chat" element={user ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/test-review" element={<TestReview />} />
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
