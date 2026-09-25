import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../firebase";
import {
  TiUser,
  TiHome,
  TiLocationArrow,
  TiHeartOutline,
  TiChevronLeft,
  TiChevronRight,
} from "react-icons/ti";

const Sidebar = ({
  user,
  setUser,
  activeView,
  setActiveView,
  profilePic,
  isCollapsed,
  setIsCollapsed,
}) => {
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      if (setUser) setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div
      className={`fixed left-0 top-0 h-screen ${isCollapsed ? "w-20" : "w-64"} bg-black/40 backdrop-blur-2xl border-r border-white/10 flex flex-col z-50 transition-all duration-300`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-8 bg-violet-600 text-white p-1 rounded-full hover:bg-violet-500 transition-colors z-50 border border-white/20 shadow-lg"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? (
          <TiChevronRight className="text-xl" />
        ) : (
          <TiChevronLeft className="text-xl" />
        )}
      </button>

      {/* Top: Logo */}
      <div
        className={`p-8 flex flex-col transition-all duration-300 ${isCollapsed ? "items-center px-4" : ""}`}
      >
        <h1 className="special-font font-zentry text-3xl uppercase text-blue-100">
          {isCollapsed ? "A." : "ANIME"}
        </h1>
        {!isCollapsed && (
          <p className="text-[10px] uppercase tracking-widest text-blue-50/40 mt-1 ml-0.5 whitespace-nowrap">
            The Hub
          </p>
        )}
      </div>

      <nav className="flex-1 px-4 mt-8 space-y-2 relative">
        <button
          onClick={() => setActiveView("discover")}
          className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-4"} px-4 py-3 rounded-xl transition-all ${activeView === "discover" ? "bg-violet-600/20 text-blue-100 border border-violet-500/20" : "text-blue-50/60 hover:bg-white/5 hover:text-blue-100"}`}
          title="Home"
        >
          <TiHome className="text-xl shrink-0" />
          {!isCollapsed && (
            <span className="text-sm font-semibold truncate whitespace-nowrap transition-opacity duration-300">
              Home
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveView("saved")}
          className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-4"} px-4 py-3 rounded-xl transition-all ${activeView === "saved" ? "bg-violet-600/20 text-blue-100 border border-violet-500/20" : "text-blue-50/60 hover:bg-white/5 hover:text-blue-100"}`}
          title="saved anime"
        >
          <TiHeartOutline className="text-xl shrink-0" />
          {!isCollapsed && (
            <span className="text-sm font-semibold truncate whitespace-nowrap transition-opacity duration-300">
              Saved Anime
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveView("profile")}
          className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-4"} px-4 py-3 rounded-xl transition-all ${activeView === "profile" ? "bg-violet-600/20 text-blue-100 border border-violet-500/20" : "text-blue-50/60 hover:bg-white/5 hover:text-blue-100"}`}
          title="Profile"
        >
          <TiUser className="text-xl shrink-0" />
          {!isCollapsed && (
            <span className="text-sm font-semibold truncate whitespace-nowrap transition-opacity duration-300">
              Profile
            </span>
          )}
        </button>
      </nav>

      <div className="p-4 relative">
        <div
          className={`flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 group ${isCollapsed ? "justify-center" : ""}`}
        >
          <div className="size-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xl overflow-hidden shrink-0">
            {profilePic ? (
              <img
                src={profilePic}
                alt="Profile"
                className="size-full object-cover"
              />
            ) : user?.name ? (
              user.name[0].toUpperCase()
            ) : (
              <TiUser />
            )}
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-blue-100 truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-[10px] text-blue-50/40 truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => setShowLogout(!showLogout)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-50/40 hover:text-red-400 group-hover:bg-white/10"
                title="Options"
              >
                <TiLocationArrow className="rotate-45" />
              </button>
            </>
          )}
        </div>

        {isCollapsed && (
          <button
            onClick={() => setShowLogout(!showLogout)}
            className="w-full mt-2 p-2 rounded-xl bg-white/5 border border-white/10 text-blue-50/40 hover:text-red-400 hover:bg-white/10 transition-colors flex justify-center"
            title="Options"
          >
            <TiLocationArrow className="rotate-45" />
          </button>
        )}

        {showLogout && (
          <div
            className={`absolute bottom-20 left-4 ${isCollapsed ? "w-40" : "right-4"} bg-black/80 backdrop-blur-3xl border border-white/10 rounded-2xl p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 z-50`}
          >
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-500/30 transition-all"
            >
              Logout Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
