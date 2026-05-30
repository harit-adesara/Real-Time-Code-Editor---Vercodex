import React, { useContext } from "react";
import { Link, Navigate } from "react-router-dom";
import { AuthContext } from "../context/Auth.jsx";

export const Landing = () => {
  const { user, loading } = useContext(AuthContext);

  console.log(user);

  if (loading)
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

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold">Vercodex</h1>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 transition"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-20">
        <h2 className="text-4xl md:text-6xl font-bold leading-tight">
          Live Code. Instant Output.
        </h2>
        <p className="mt-6 text-gray-400 max-w-xl">
          A simple live code editor to write, run and test code instantly in the
          browser.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            to="/register"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 border border-gray-600 hover:bg-gray-800 rounded-lg text-lg"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-gray-900">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Feature 1 */}
          <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 text-center">
            <div className="text-3xl mb-3">💻</div>
            <h3 className="text-xl font-semibold">Better Team Collaboration</h3>
            <p className="text-gray-400 mt-2">
              Increase productivity among team members
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 text-center">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-xl font-semibold">Fast Performance</h3>
            <p className="text-gray-400 mt-2">
              Optimized for smooth developer experience.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 text-center">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="text-xl font-semibold">Simple UI</h3>
            <p className="text-gray-400 mt-2">
              Clean and distraction-free coding environment.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h3 className="text-3xl font-bold">Build Faster with Vercodex</h3>
        <p className="text-gray-400 mt-3">
          No setup. No complexity. Just code.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            to="/register"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 border border-gray-600 hover:bg-gray-800 rounded-lg"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-gray-500 border-t border-gray-800">
        © {new Date().getFullYear()} Vercodex
      </footer>
    </div>
  );
};

export default Landing;
