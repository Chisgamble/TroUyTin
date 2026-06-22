import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import HomePage from './pages/HomePage';
import ListingDetailPage from './pages/ListingDetailPage';
import SearchResultsPage from './pages/SearchResultsPage';

// TODO: Uncomment khi build các trang khác
// import PostListingPage from './pages/PostListingPage';
// import RoommatePage from './pages/RoommatePage';
// import ChatPage from './pages/ChatPage';
// import SavedListingsPage from './pages/SavedListingsPage';
// import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tim-kiem" element={<SearchResultsPage />} />
          <Route path="/phong/:id" element={<ListingDetailPage />} />

          {/* TODO: Uncomment khi build các trang khác
          <Route path="/dang-tin" element={<PostListingPage />} />
          <Route path="/o-ghep" element={<RoommatePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/da-luu" element={<SavedListingsPage />} />
          <Route path="/ho-so" element={<ProfilePage />} />
          */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
