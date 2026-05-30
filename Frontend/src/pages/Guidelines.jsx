import React from "react";

const Guidelines = () => {
  return (
    <div className="text-white p-6 max-w-4xl mx-auto">
      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-6">Welcome to Vercodex 🚀</h1>

      {/* INTRO */}
      <div className="bg-[rgb(15,23,42)] border border-white/10 p-6 rounded-2xl mb-6">
        <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
        <p className="text-gray-300">
          Vercodex is a real-time collaborative coding platform where you can
          create rooms, invite users, and code together.
        </p>
      </div>

      {/* HOW TO USE */}
      <div className="bg-[rgb(15,23,42)] border border-white/10 p-6 rounded-2xl mb-6">
        <h2 className="text-xl font-semibold mb-3">How to Use</h2>

        <ul className="space-y-2 text-gray-300 list-disc pl-5">
          <li>Go to "Create Room" to start a new coding session</li>
          <li>Use "Join Room" if someone shares a room ID</li>
          <li>Search users and invite them to collaborate</li>
          <li>All changes sync in real-time</li>
        </ul>
      </div>

      {/* FEATURES */}
      <div className="bg-[rgb(15,23,42)] border border-white/10 p-6 rounded-2xl mb-6">
        <h2 className="text-xl font-semibold mb-3">Features</h2>

        <ul className="space-y-2 text-gray-300 list-disc pl-5">
          <li>⚡ Real-time code editor</li>
          <li>👥 Multi-user collaboration</li>
          <li>🔔 Notifications system</li>
          <li>🔐 Secure authentication</li>
          <li>📁 Room-based workspace</li>
          <li>💬 Chat inside rooms</li>
        </ul>
      </div>
    </div>
  );
};

export default Guidelines;
