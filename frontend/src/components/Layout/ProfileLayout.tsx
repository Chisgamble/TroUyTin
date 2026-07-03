import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getProfile, type Profile } from '../../services/profiles';
import ProfileSidebar from '../profile/ProfileSidebar';

export default function ProfileLayout() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    getProfile(user.id)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <div className="p-10">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-5">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-6 items-start">

          <ProfileSidebar profile={profile} />

          <main className="flex-1 min-w-0">
            <Outlet context={{
                profile,
                setProfile,
            }} />
          </main>

        </div>
      </div>
    </div>
  );
}