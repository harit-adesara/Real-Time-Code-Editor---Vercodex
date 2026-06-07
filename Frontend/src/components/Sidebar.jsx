import React, { useState, useEffect, useContext } from "react";
import axios from "../axios.js";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { socket } from "../socket";
import { AuthContext } from "../context/Auth.jsx";

const Sidebar = () => {
  let [open, setOpen] = useState(false);
  let [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const { user, setUser } = useContext(AuthContext);

  const menuItems = [
    {
      title: "Dashboard",
      icon: "📊",
      path: "/dashboard",
    },
    {
      title: "Notifications",
      icon: "🔔",
      path: "/dashboard/notifications",
    },
    {
      title: "My Rooms",
      icon: "👨‍💻",
      path: "/dashboard/my-rooms",
    },
    {
      title: "Create Room",
      icon: "➕",
      path: "/dashboard/create-room",
    },
    {
      title: "Join Room",
      icon: "🚀",
      path: "/dashboard/join-room",
    },
    {
      title: "Search User",
      icon: "🔍",
      path: "/dashboard/search-user",
    },
  ];

  const handleLogout = async () => {
    try {
      await axios.post(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/logout",
        {},
        { withCredentials: true },
      );

      setUser(null);
    } catch (err) {
      console.log("Logout failed", err);
    }
  };

  const getUnreadCount = async () => {
    try {
      const response = await axios.get(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/notifications/unread-count",
        {
          withCredentials: true,
        },
      );

      setUnreadCount(response.data.data.unreadCount || 0);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const handleNewInvite = () => {
      // 🛠️ Only increment if the user isn't currently looking at the notification page
      if (window.location.pathname !== "/dashboard/notifications") {
        setUnreadCount((prev) => prev + 1);
      }
    };
    socket.on("new-invitation", handleNewInvite);

    return () => {
      socket.off("new-invitation", handleNewInvite);
    };
  }, []); // 👈 Added location dependency to hook cleanly

  // Re-fetch unread count whenever the path changes
  // useEffect(() => {
  //   getUnreadCount();
  // }, [location.pathname]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-500 text-white px-3 py-2 rounded-lg"
      >
        ☰
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50
          w-65 min-h-screen
          bg-[rgb(15,23,42)]
          border-r border-white/10
          p-5 flex flex-col justify-between
          transition-transform duration-300

          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div>
          {/* Logo */}
          <div className="mb-10 mt-10 md:mt-0">
            <h1 className="text-3xl font-bold text-white">
              Ver<span className="text-blue-500">codex</span>
            </h1>

            <p className="text-gray-400 text-sm mt-1">
              Code Together in Real-Time
            </p>
          </div>

          {/* Menu */}
          <div className="space-y-3">
            {menuItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.path}
                end={item.path === "/dashboard"}
                onClick={() => {
                  setOpen(false);
                  if (item.title === "Notifications") {
                    setUnreadCount(0);
                  }
                }}
                className={({ isActive }) =>
                  `
                  w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300

                  ${
                    isActive
                      ? "bg-linear-to-r from-blue-500 to-purple-500 text-white"
                      : "text-gray-300 hover:bg-[rgb(30,41,59)]"
                  }
                `
                }
              >
                {/* Left */}
                <div className="flex items-center gap-3">
                  <span>{item.icon}</span>

                  <span className="font-medium">{item.title}</span>
                </div>

                {/* Notification Count */}
                {item.title === "Notifications" && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="space-y-3">
          <NavLink
            to="/dashboard/profile"
            className={({ isActive }) =>
              `
              w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300

              ${
                isActive
                  ? "bg-linear-to-r from-blue-500 to-purple-500 text-white"
                  : "text-gray-300 hover:bg-[rgb(30,41,59)]"
              }
            `
            }
          >
            <span>👤</span>
            <span>Profile</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/25 transition"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
