import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import HomePage from './pages/HomePage';
import ListingDetailPage from './pages/ListingDetailPage';
import SearchResultsPage from './pages/SearchResultsPage';

import Login from './pages/Login';
import Profile from './pages/Profile';
import ResetPassword from './pages/ResetPassword';
import { TestReview } from './pages/TestReview';
import { Chat } from './pages/Chat';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tim-kiem" element={<SearchResultsPage />} />
          <Route path="/phong/:id" element={<ListingDetailPage />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/chat" element={user ? <Chat /> : <Navigate to="/login" />} />
          <Route path="/test-review" element={<TestReview />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
