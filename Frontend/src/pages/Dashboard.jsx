import React from "react";
import { Outlet } from "react-router-dom";

import Header from "../components/Header.jsx";
import Sidebar from "../components/Sidebar.jsx";
import Footer from "../components/Footer.jsx";

const Dashboard = () => {
  return (
    <div className="bg-[rgb(2,6,23)] h-screen flex overflow-hidden">
      {/* Sidebar */}
      <div className="h-full shrink-0">
        <Sidebar />
      </div>

      {/* Right Section */}
      <div className="flex flex-col flex-1 h-full">
        {/* Header */}
        <div className="shrink-0">
          <Header />
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <div className="shrink-0">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
