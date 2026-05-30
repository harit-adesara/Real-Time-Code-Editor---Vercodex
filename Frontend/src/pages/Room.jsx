import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Room = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getRooms = async () => {
    try {
      const res = await axios.get("http://localhost:3000/vercodex/rooms", {
        withCredentials: true,
      });

      setRooms(res.data.data.rooms || []);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRooms();
  }, []);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-white text-xl">
        Loading rooms...
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-amber-50 bold text-3xl font-bold mb-6">My Rooms</h1>

      <div className="grid gap-4">
        {rooms.map((room) => (
          <div
            key={room._id}
            className="bg-[rgb(15,23,42)] p-5 rounded-2xl border border-white/10 hover:border-blue-500 cursor-pointer transition"
            onClick={() => navigate(`/editor/${room.roomId._id}`)}
          >
            <h2 className="text-amber-50 text-xl font-semibold">
              {room.roomId?.name}
            </h2>

            <p className="text-gray-400">Code: {room.roomId?.roomCode}</p>

            <p className="text-gray-400">Role: {room.role}</p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/dashboard/my-rooms/details/${room.roomId._id}`);
              }}
              className="text-gray-500 text-sm mt-3 hover:text-gray-400 transition"
            >
              Click to view details →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Room;
