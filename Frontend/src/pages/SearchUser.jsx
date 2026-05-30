import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SearchUser = () => {
  const [username, setUsername] = useState("");
  const [users, setUsers] = useState([]);

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [status, setStatus] = useState({ type: "", text: "" });

  const navigate = useNavigate();

  // AUTO FETCH ROOMS
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axios.get("http://localhost:3000/vercodex/rooms", {
        withCredentials: true,
      });

      setRooms(res.data.data.rooms || []);
    } catch (err) {}
  };

  // SEARCH USERS
  const searchUsers = async () => {
    if (!username.trim()) return;

    try {
      const res = await axios.post(
        "http://localhost:3000/vercodex/users/search",
        { username },
        { withCredentials: true },
      );

      setUsers(res.data.data.users || []);
    } catch (err) {
      setStatus({ type: "error", text: "Failed to search users" });
      setTimeout(() => setStatus({ type: "", text: "" }), 3000);
    }
  };

  // SEND INVITE
  const sendInvite = async () => {
    try {
      await axios.post(
        "http://localhost:3000/vercodex/room/invite",
        {
          roomId: selectedRoom,
          username: selectedUser.username,
        },
        { withCredentials: true },
      );

      setStatus({
        type: "success",
        text: "Invitation sent successfully",
      });
      setTimeout(() => setStatus({ type: "", text: "" }), 3000);

      setShowModal(false);
      setSelectedUser(null);
    } catch (err) {
      setStatus({
        type: "error",
        text: "Failed to send invite",
      });
      setTimeout(() => setStatus({ type: "", text: "" }), 3000);

      setShowModal(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Search User</h1>

      {/* ROOM SELECT */}
      <select
        className="w-full p-3 mb-4 rounded-xl bg-[rgb(15,23,42)] border border-white/10"
        value={selectedRoom}
        onChange={(e) => setSelectedRoom(e.target.value)}
      >
        <option value="">Select Room</option>

        {rooms.map((r) => (
          <option key={r._id} value={r.roomId._id}>
            {r.roomId.name} ({r.role})
          </option>
        ))}
      </select>

      {/* SEARCH INPUT */}
      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 p-3 rounded-xl bg-[rgb(15,23,42)] border border-white/10"
          placeholder="Search username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <button
          onClick={searchUsers}
          className="px-5 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition disabled:opacity-40"
        >
          Search
        </button>
      </div>

      {/* USERS LIST */}
      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user._id}
            className="flex justify-between items-center p-4 rounded-2xl bg-[rgb(15,23,42)] border border-white/10"
          >
            <h2>{user.username}</h2>

            <button
              disabled={!selectedRoom}
              onClick={() => {
                setSelectedUser(user);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-500 rounded-xl disabled:opacity-40"
            >
              Invite
            </button>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-[rgb(15,23,42)] p-6 rounded-2xl w-[90%] max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Invite</h2>

            <p className="text-gray-400 mb-4">
              Send invite to{" "}
              <span className="text-white font-semibold">
                {selectedUser?.username}
              </span>
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-600 rounded-xl"
              >
                Cancel
              </button>

              <button
                onClick={sendInvite}
                className="px-4 py-2 bg-green-500 rounded-xl"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS MESSAGE */}
      {status.text && (
        <p
          className={`mt-3 ${
            status.type === "success" ? "text-green-400" : "text-red-400"
          }`}
        >
          {status.text}
        </p>
      )}
    </div>
  );
};

export default SearchUser;
