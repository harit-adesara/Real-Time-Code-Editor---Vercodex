import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/Auth.jsx";

const PublicRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-700"></div>
            <div className="w-16 h-16 rounded-full border-4 border-t-blue-500 animate-spin absolute top-0 left-0"></div>
          </div>

          {/* Text */}
          <p className="text-gray-300 text-sm tracking-wide">
            Verifying session...
          </p>

          {/* Animated dots */}
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></span>
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-300"></span>
          </div>
        </div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicRoute;
