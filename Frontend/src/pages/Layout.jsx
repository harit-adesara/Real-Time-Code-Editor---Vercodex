import React, { useContext } from "react";

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-white">
      {/* SIDEBAR (hidden on mobile) */}
      <div className="w-full md:w-64 bg-slate-900 p-5 border-b md:border-b-0 md:border-r border-slate-800">
        <h1 className="text-2xl font-bold text-blue-400 mb-6 md:mb-8">
          Vercodex
        </h1>

        <div className="flex md:block gap-4 md:space-y-4 text-gray-300 text-sm md:text-base">
          <p className="cursor-pointer hover:text-white">🏠 Dashboard</p>
          <p className="cursor-pointer hover:text-white">📁 My Rooms</p>
          <p className="cursor-pointer hover:text-white">⭐ Favorites</p>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:justify-end items-stretch sm:items-center gap-3 px-4 sm:px-6 py-4 bg-slate-900 border-b border-slate-800">
          <button className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto">
            + Create Room
          </button>

          <button className="bg-slate-800 px-3 py-2 rounded-lg w-full sm:w-auto">
            🔔 Notifications
          </button>

          <button className="bg-slate-800 px-3 py-2 rounded-lg w-full sm:w-auto">
            👤 Profile
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex flex-col lg:flex-row flex-1">
          {/* CENTER */}
          <div className="flex-1 p-4 sm:p-6 space-y-6">
            {/* CREATE + JOIN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CREATE ROOM */}
              <div className="bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-800">
                <h2 className="text-lg font-bold">🚀 Create Room</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Start a new coding session
                </p>
                <button className="mt-4 bg-blue-600 px-4 py-2 rounded-lg w-full sm:w-auto">
                  Create
                </button>
              </div>

              {/* JOIN ROOM */}
              <div className="bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-800">
                <h2 className="text-lg font-bold">🔑 Join Room</h2>

                <input
                  placeholder="Room Code"
                  className="w-full mt-3 px-3 py-2 bg-slate-800 rounded-lg outline-none text-sm"
                />

                <input
                  type="password"
                  placeholder="Room Password"
                  className="w-full mt-3 px-3 py-2 bg-slate-800 rounded-lg outline-none text-sm"
                />

                <button className="mt-4 bg-green-600 px-4 py-2 rounded-lg w-full sm:w-auto">
                  Join
                </button>
              </div>
            </div>

            {/* GUIDELINES */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6">
              <h1 className="text-xl sm:text-2xl font-bold text-blue-400 mb-3 sm:mb-4">
                👋 Welcome to Vercodex
              </h1>

              <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
                Follow these steps to start collaborating in real time:
              </p>

              <div className="space-y-3 sm:space-y-4 text-gray-300 text-sm sm:text-base">
                <div className="bg-slate-800 p-3 sm:p-4 rounded-lg">
                  🚀 Create a room to start coding with your team instantly.
                </div>

                <div className="bg-slate-800 p-3 sm:p-4 rounded-lg">
                  🔑 Join a room using code and password.
                </div>

                <div className="bg-slate-800 p-3 sm:p-4 rounded-lg">
                  💬 Collaborate with live chat and real-time editing.
                </div>

                <div className="bg-slate-800 p-3 sm:p-4 rounded-lg">
                  ⚡ Everything syncs instantly in real time.
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL → becomes bottom on mobile */}
          <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4">
            <h2 className="text-lg font-bold mb-4">🔔 Notifications</h2>

            <div className="space-y-3 text-sm">
              <div className="bg-slate-800 p-3 rounded-lg">
                Aman joined React Room
              </div>

              <div className="bg-slate-800 p-3 rounded-lg">
                New message in Node Room
              </div>

              <div className="bg-slate-800 p-3 rounded-lg">
                Room updated successfully
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
