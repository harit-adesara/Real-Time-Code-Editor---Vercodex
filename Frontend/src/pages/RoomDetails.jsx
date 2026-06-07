import React, { useEffect, useState } from "react";
import axios from "../axios.js";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket";

const RoomDetails = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  // 🔥 split state properly
  const [members, setMembers] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [modalAlert, setModalAlert] = useState({
    isOpen: false,
    title: "",
    message: "",
    redirectPath: "",
  });

  // ---------------- FETCH ROOM ----------------
  const getRoomDetails = async () => {
    try {
      const res = await axios.get(
        `https://real-time-code-editor-vercodex.onrender.com/vercodex/room/detail?roomId=${roomId}`,
        { withCredentials: true },
      );

      setMembers(res.data.data.roomDetail || []);
      setRoomInfo(res.data.data.roomDetail?.[0]?.roomId || null);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- FETCH USER ----------------
  const getMe = async () => {
    try {
      const res = await axios.get(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/me",
        {
          withCredentials: true,
        },
      );

      setCurrentUserId(res.data.data._id);
    } catch (err) {
      console.log(err);
    }
  };

  // initial load
  useEffect(() => {
    getRoomDetails();
    getMe();
  }, [roomId]);

  // ---------------- LEAVE ROOM ----------------
  const leaveRoom = async () => {
    try {
      await axios.post(
        `https://real-time-code-editor-vercodex.onrender.com/vercodex/room/leave?roomId=${roomId}`,
        {},
        { withCredentials: true },
      );

      navigate("/dashboard/my-rooms");
    } catch (err) {
      console.log(err);
    }
  };

  // ---------------- REMOVE USER ----------------
  const removeUser = async (userId) => {
    try {
      await axios.post(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/room/remove-member",
        { roomId, userId },
        { withCredentials: true },
      );

      setMembers((prev) => prev.filter((m) => m.userId._id !== userId));
    } catch (err) {
      console.log(err);
    }
  };

  // ---------------- SOCKET ----------------
  useEffect(() => {
    if (!roomId || !currentUserId) return;

    socket.emit("join-room", roomId);

    const handleMemberJoined = (member) => {
      setMembers((prev) => [...prev, member]);
    };

    const handleMemberLeft = (userId) => {
      setMembers((prev) => prev.filter((m) => m.userId._id !== userId.userId));
    };

    const handleRoomDeleted = () => {
      console.log("The owner has deleted this workspace room.");
      setModalAlert({
        isOpen: true,
        title: "Workspace Deleted",
        message: "This workspace has been deleted by the owner.",
        redirectPath: "/dashboard/my-rooms",
      });
    };

    const handleMemberRemoved = (data) => {
      if (currentUserId && String(data.userId) === String(currentUserId)) {
        setModalAlert({
          isOpen: true,
          title: "Access Revoked",
          message: "You have been removed from this room by the owner.",
          redirectPath: "/dashboard/my-rooms",
        });
      }
    };

    socket.on("member-joined", handleMemberJoined);
    socket.on("member-left", handleMemberLeft);
    socket.on("member-removed", handleMemberRemoved);
    socket.on("room-deleted", handleRoomDeleted);

    return () => {
      socket.off("member-joined", handleMemberJoined);
      socket.off("member-left", handleMemberLeft);
      socket.off("member-removed", handleMemberRemoved);
      socket.off("room-deleted", handleRoomDeleted);
      socket.emit("leave-room", roomId);
    };
  }, [roomId, currentUserId]);

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-white text-xl">
        Loading room details...
      </div>
    );
  }

  if (!roomInfo) {
    return <div className="text-white text-xl">Room not found</div>;
  }

  const isOwner = roomInfo?.ownerId?.toString() === currentUserId?.toString();

  // ---------------- UI ----------------
  return (
    <div className="text-white">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{roomInfo?.name}</h1>
          <p className="text-gray-400">Code: {roomInfo?.roomCode}</p>
        </div>

        <button
          onClick={leaveRoom}
          className="bg-red-500/20 text-red-400 px-4 py-2 rounded-xl hover:bg-red-500/30 transition"
        >
          Leave Room
        </button>
      </div>

      {/* MEMBERS */}
      <div className="bg-[rgb(15,23,42)] p-5 rounded-2xl border border-white/10">
        <h2 className="text-2xl mb-4 font-semibold">Members</h2>

        {members.map((m) => (
          <div
            key={m._id}
            className="flex justify-between items-center py-2 border-b border-white/10"
          >
            <div>
              <span className="text-gray-200">
                Username: {m.userId?.username}
              </span>
              <span className="ml-3 text-gray-400 text-sm">{m.role}</span>
            </div>

            {isOwner && m.role !== "Owner" && (
              <button
                onClick={() => removeUser(m.userId._id)}
                className="text-red-400 text-sm px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      {modalAlert.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl transition-all">
            <h3 className="text-xl font-bold text-slate-50">
              {modalAlert.title}
            </h3>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              {modalAlert.message}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setModalAlert((prev) => ({ ...prev, isOpen: false }));
                  if (modalAlert.redirectPath) {
                    navigate(modalAlert.redirectPath);
                  }
                }}
                className="rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-md transition hover:bg-sky-400"
              >
                Okay, Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomDetails;
