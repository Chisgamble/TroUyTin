import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import type { Notification } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { getProfile, type Profile } from "../../services/profiles";
import { Heart } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      getProfile(user.id).then(setProfile).catch(console.error);
    } else {
      setProfile(null);
    }
  }, [user]);

  useEffect(() => {
    async function loadNotifications() {
      if (!user?.id) {
        setNotifications([]);
        return;
      }

      const { data, error } = await supabase
        .from<Notification>("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setNotifications(data ?? []);
    }

    loadNotifications();
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="legacy-page-wrapper">
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo">
            TroUyTin
          </Link>

          <form
            className="navbar-search"
            onSubmit={(e) => {
              e.preventDefault();
              const q = searchQuery.trim();
              if (q) navigate(`/tim-kiem?q=${encodeURIComponent(q)}`);
            }}
          >
            <svg
              className="navbar-search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Tìm theo khu vực, đường, quận..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="navbar-search-input"
            />
          </form>

          <div className="navbar-links">
            <Link to="/" className="navbar-link active">
              Tìm phòng
            </Link>
            <Link to="/roommate-matching" className="navbar-link">
              Tìm ở ghép
            </Link>
            <Link to="#" className="navbar-link">
              Tin tức
            </Link>
            <Link to="#" className="navbar-link">
              Về chúng tôi
            </Link>
          </div>

          <div className="navbar-actions">
            {profile?.role === "LANDLORD" && (
              <Link to="/dang-tin" className="navbar-post-btn">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
                <span>Đăng tin</span>
              </Link>
            )}

            <div className="navbar-dropdown-wrapper" ref={notifRef}>
              <button
                className="navbar-icon-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Thông báo"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="navbar-badge">{unreadCount}</span>
                )}
              </button>
              {showNotifications && (
                <div className="navbar-dropdown notifications-dropdown">
                  <div className="dropdown-header">
                    <h3>Thông báo</h3>
                  </div>
                  <div className="dropdown-list">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`dropdown-item ${!notif.is_read ? "unread" : ""}`}
                      >
                        <div className="dropdown-item-title">{notif.title}</div>
                        <div className="dropdown-item-body">{notif.body}</div>
                        <div className="dropdown-item-time">
                          {new Date(notif.created_at ?? "").toLocaleDateString(
                            "vi-VN",
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              className="navbar-icon-btn"
              aria-label="Đã lưu"
              onClick={() => navigate("/profile/saved-rooms")}
            >
              <Heart size={22} />
            </button>

            {user ? (
              <div className="navbar-dropdown-wrapper" ref={profileRef}>
                <button
                  className="navbar-avatar-btn"
                  onClick={() => setShowProfile(!showProfile)}
                  aria-label="Hồ sơ"
                >
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile?.fullName || ""}
                      className="navbar-avatar"
                    />
                  ) : (
                    <div
                      className="navbar-avatar"
                      style={{
                        backgroundColor: "#3b82f6",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {(profile?.fullName ||
                        user.email ||
                        "?")[0].toUpperCase()}
                    </div>
                  )}
                </button>
                {showProfile && (
                  <div className="navbar-dropdown profile-dropdown">
                    <div className="dropdown-profile-header">
                      {profile?.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt=""
                          className="dropdown-avatar"
                        />
                      ) : (
                        <div
                          className="dropdown-avatar"
                          style={{
                            backgroundColor: "#3b82f6",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            fontSize: "1.25rem",
                          }}
                        >
                          {(profile?.fullName ||
                            user.email ||
                            "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="dropdown-profile-name">
                          {profile?.fullName || "Chưa cập nhật tên"}
                        </div>
                        <div className="dropdown-profile-email">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-divider" />
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setShowProfile(false);
                        navigate("/profile");
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Hồ sơ cá nhân
                    </button>
                    <div className="dropdown-divider" />
                    <button
                      className="dropdown-item dropdown-logout"
                      onClick={() => {
                        signOut();
                        setShowProfile(false);
                        navigate("/");
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16,17 21,12 16,7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="navbar-link"
                style={{ fontWeight: "600", color: "#1d4ed8" }}
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
