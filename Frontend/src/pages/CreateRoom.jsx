import React, { useState } from "react";
import axiosInstance from "../axios.js";

const CreateRoom = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const createRoomHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await axiosInstance.post(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/room/create",
        { name, password },
        { withCredentials: true },
      );

      setMessage(
        `Room created successfully! Code: ${res.data.data.room.roomCode}`,
      );

      setName("");
      setPassword("");
    } catch (err) {
      setError("Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(10,15,30)] text-white">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[rgb(15,23,42)] border border-white/10 shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-2">Create Room</h1>
        <p className="text-gray-400 text-center mb-6">
          Start a new coding room instantly
        </p>

        {message && (
          <div className="bg-green-500/10 text-green-400 p-3 rounded-xl mb-4">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={createRoomHandler} className="space-y-4">
          <input
            type="text"
            placeholder="Room Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-xl bg-[rgb(30,41,59)] outline-none"
          />

          <input
            type="password"
            placeholder="Room Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-[rgb(30,41,59)] outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 transition py-3 rounded-xl font-semibold"
          >
            {loading ? "Creating..." : "Create Room"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRoom;
