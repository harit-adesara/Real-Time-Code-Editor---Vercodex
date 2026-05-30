import React from "react";

const Header = () => {
  return (
    <header className="w-full h-16 border-b border-white/10 bg-[rgb(15,23,42)] px-4 md:px-6 flex items-center justify-between z-30">
      {/* Left */}
      <div className="flex items-center gap-3 ml-14 md:ml-0">
        <div className="w-10 h-10 rounded-xl bg-linear-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
          <span className="text-white text-xl font-bold">V</span>
        </div>

        <div>
          <h1 className="text-white text-lg font-bold">Vercodex</h1>
          <p className="text-gray-400 text-xs hidden sm:block">
            Live Code Editor
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
