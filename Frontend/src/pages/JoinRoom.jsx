import React, { useState } from "react";
import axios from "../axios.js";
import { useNavigate } from "react-router-dom";

const JoinRoom = () => {
  const [roomCode, setRoomCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const joinRoomHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/room/join-password",
        { roomCode, password },
        { withCredentials: true },
      );

      navigate(`/dashboard/my-rooms`);
    } catch (err) {
      setError("Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(10,15,30)] text-white">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[rgb(15,23,42)] border border-white/10 shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-2">Join Room</h1>
        <p className="text-gray-400 text-center mb-6">
          Enter code and password to join
        </p>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={joinRoomHandler} className="space-y-4">
          <input
            type="text"
            placeholder="Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
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
            className="w-full bg-green-500 hover:bg-green-600 transition py-3 rounded-xl font-semibold"
          >
            {loading ? "Joining..." : "Join Room"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinRoom;
