// Footer.jsx

import React from "react";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer className="w-full border-t border-white/10 bg-[rgb(15,23,42)] px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Left */}
      <div className="text-center md:text-left">
        <h2 className="text-white font-semibold text-lg">Vercodex</h2>

        <p className="text-gray-400 text-sm">
          Real-time collaborative coding platform.
        </p>
      </div>

      {/* Center */}
      <div className="flex items-center gap-6 text-sm text-gray-400">
        <button
          className="hover:text-blue-400 transition"
          onClick={() => navigate("/privacy")}
        >
          Privacy
        </button>

        <button
          className="hover:text-blue-400 transition"
          onClick={() => navigate("/terms")}
        >
          Terms
        </button>

        <button
          className="hover:text-blue-400 transition"
          onClick={() => navigate("/docs")}
        >
          Docs
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-xl bg-[rgb(30,41,59)] hover:bg-[rgb(51,65,85)] transition">
          🐙
        </button>

        <button className="p-2 rounded-xl bg-[rgb(30,41,59)] hover:bg-[rgb(51,65,85)] transition">
          🐦
        </button>

        <button className="p-2 rounded-xl bg-[rgb(30,41,59)] hover:bg-[rgb(51,65,85)] transition">
          💼
        </button>
      </div>
    </footer>
  );
};

export default Footer;
