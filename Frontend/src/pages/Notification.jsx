import React, { useEffect, useState } from "react";
import axiosInstance from "../axios.js";
import { socket } from "../socket";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Get Notifications
  const getNotifications = async () => {
    try {
      const response = await axiosInstance.get(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/notifications",
        {
          withCredentials: true,
        },
      );

      setNotifications(response.data.data || []);
    } catch (error) {
      setError("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  // Delete Notification
  const deleteNotification = async (notificationId) => {
    try {
      await axiosInstance.delete(
        `https://real-time-code-editor-vercodex.onrender.com/vercodex/notifications/delete/${notificationId}`,
        {
          withCredentials: true,
        },
      );

      setNotifications((prev) =>
        prev.filter((item) => item._id !== notificationId),
      );

      setError("");
      setMessage("Notification deleted successfully");

      setTimeout(() => {
        setError("");
        setMessage("");
      }, 3000);
    } catch (error) {
      setMessage("");
      setError("Failed to delete notification");

      setTimeout(() => {
        setError("");
        setMessage("");
      }, 3000);
    }
  };

  // Join Room
  const joinRoom = async (roomCode, notificationId) => {
    try {
      await axiosInstance.post(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/room/join-invite",
        { roomCode, notificationId },
        {
          withCredentials: true,
        },
      );

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notificationId ? { ...item, isProcessed: true } : item,
        ),
      );

      setError("");
      setMessage("Joined successfully");

      setTimeout(() => {
        setError("");
        setMessage("");
      }, 3000);
    } catch (err) {
      setError("Something went wrong");

      setTimeout(() => {
        setError("");
        setMessage("");
      }, 3000);
    }
  };

  useEffect(() => {
    getNotifications();

    // Mark all notifications as read automatically
    axiosInstance.patch(
      "https://real-time-code-editor-vercodex.onrender.com/vercodex/notifications/mark-read",
      {},
      {
        withCredentials: true,
      },
    );

    // setNotifications((prev) =>
    //   prev.map((item) => ({
    //     ...item,
    //     isRead: true,
    //   })),
    //);
  }, []);

  useEffect(() => {
    const handleNewInvite = (data) => {
      setNotifications((prev) => [data, ...prev]);
    };

    socket.on("new-invitation", handleNewInvite);

    return () => {
      socket.off("new-invitation", handleNewInvite);
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-white text-xl">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-gray-400 mt-1">
            Stay updated with your room activities
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 px-4 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/30">
          {message}
        </div>
      )}

      {/* Empty State */}
      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-32">
          <div className="text-7xl">🔔</div>
          <h2 className="text-2xl font-bold mt-4">No Notifications</h2>
          <p className="text-gray-400 mt-2">You are all caught up</p>
        </div>
      )}

      {/* Notification List */}
      <div className="space-y-5">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className="w-full rounded-3xl border p-5 transition-all duration-300 bg-[rgb(15,23,42)] border-white/10 hover:border-blue-500/40"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left */}
              <div className="flex gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl
                    ${
                      notification.type === "ROOM_INVITE"
                        ? "bg-blue-500/20"
                        : "bg-red-500/20"
                    }
                  `}
                >
                  {notification.type === "ROOM_INVITE" ? "📩" : "🚫"}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      {notification.title}
                    </h2>
                  </div>

                  <p className="text-gray-300 mt-1">{notification.message}</p>

                  <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                    <span>By {notification.senderId?.username}</span>
                    <span>•</span>
                    <span>
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              {/* Buttons */}
              <div className="flex items-center gap-3">
                {notification.type === "ROOM_INVITE" &&
                  !notification.isProcessed && (
                    <button
                      onClick={() =>
                        joinRoom(
                          notification.metadata?.roomCode,
                          notification._id,
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 transition font-medium"
                    >
                      Join
                    </button>
                  )}

                {notification.type === "ROOM_INVITE" &&
                  notification.isProcessed && (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl bg-gray-500/20 text-gray-500 cursor-not-allowed font-medium"
                    >
                      Joined
                    </button>
                  )}

                <button
                  onClick={() => deleteNotification(notification._id)}
                  className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                >
                  Delete
                </button>
              </div>
              {/* <div className="flex items-center gap-3">
                {notification.type === "ROOM_INVITE" && (
                  <button
                    onClick={() => joinRoom(notification.metadata?.roomCode)}
                    className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 transition font-medium"
                  >
                    Join
                  </button>
                )}

                <button
                  onClick={() => deleteNotification(notification._id)}
                  className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                >
                  Delete
                </button>
              </div> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
