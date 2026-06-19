import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/axios";

type Profile = {
  id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
};

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");

  const { user, session, signOut } = useAuth();
  const navigate = useNavigate();

  // --------------------
  // FETCH PROFILE
  // --------------------
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get("/api/profiles/me");

        const data = res.data;
        setProfile(data);

        if (data) {
          setUsername(data.username || "");
          setFullName(data.fullName || "");
        }
      } catch (err) {
        console.log("No profile yet");
      } finally {
        setLoading(false);
      }
    }

    if (session?.access_token) {
      loadProfile();
    }
  }, [session]);

  // --------------------
  // CREATE
  // --------------------
  const createProfile = async () => {
    console.log(session?.access_token);
    const res = await api.post(
      "/api/profiles",
      { username, fullName }
    );

    setProfile(res.data);
  };

  // --------------------
  // UPDATE
  // --------------------
  const updateProfile = async () => {
    const res = await api.patch(
      "/api/profiles/me",
      { username, fullName }
    );

    setProfile(res.data);
  };

  // --------------------
  // DELETE
  // --------------------
  const deleteProfile = async () => {
    await api.delete("/api/profiles/me");

    setProfile(null);
    setUsername("");
    setFullName("");
  };

  // --------------------
  // LOGOUT
  // --------------------
  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // --------------------
  // UI
  // --------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>

          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>

            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>

        {/* FORM */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <div className="flex gap-2">
            {!profile ? (
              <button
                onClick={createProfile}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Create
              </button>
            ) : (
              <>
                <button
                  onClick={updateProfile}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Update
                </button>

                <button
                  onClick={deleteProfile}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* DISPLAY */}
        {profile && (
          <div className="mt-6 bg-white p-4 rounded shadow">
            <p><b>Username:</b> {profile.username}</p>
            <p><b>Full Name:</b> {profile.fullName}</p>
          </div>
        )}
      </div>
    </div>
  );
}