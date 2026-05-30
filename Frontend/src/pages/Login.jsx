import React from "react";
import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/Auth";

const Login = () => {
  let [email, setEmail] = useState("");
  let [password, setPassword] = useState("");
  let [error, setError] = useState("");
  let [loading, setLoading] = useState(false);

  let { user, setUser } = useContext(AuthContext);

  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("⚠️ Please fill all fields");
      return;
    }

    if (!email.includes("@")) {
      setError("⚠️ Enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:3000/vercodex/login",
        {
          email,
          password,
        },
        {
          withCredentials: true,
        },
      );

      console.log("Hello");

      setEmail("");
      setPassword("");
      setError("");
      setUser(res.data.data.user);
      setLoading(false);
      navigate("/dashboard");
    } catch (error) {
      setError("❌ Login failed. Try again.");
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[rgb(2,6,23)]">
      {/* Glow Effects (fixed positioning) */}
      <div className="absolute w-72 h-72 bg-blue-500/20 rounded-full blur-3xl top-10 left-10"></div>
      <div className="absolute w-72 h-72 bg-purple-500/20 rounded-full blur-3xl bottom-10 right-10"></div>

      {/* LEFT SIDE - LOGIN */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-10 relative z-10">
        <div className="w-full max-w-md bg-[rgba(15,23,42,0.8)] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Heading */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Welcome To Vercodex
            </h1>

            <p className="text-gray-400">Sign in to continue</p>
          </div>

          {/* Form */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
              {error}
            </div>
          )}
          <form
            className="space-y-5"
            onSubmit={(e) => submitHandler(e)}
            noValidate
          >
            <div>
              <label className="text-sm text-gray-300 block mb-2">Email</label>

              <input
                type="email"
                value={email}
                placeholder="Enter your email"
                required
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[rgb(30,41,59)] text-white px-4 py-3 rounded-xl outline-none border border-transparent focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300 block mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                placeholder="Enter your password"
                required
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[rgb(30,41,59)] text-white px-4 py-3 rounded-xl outline-none border border-transparent focus:border-blue-500 transition"
              />
            </div>

            <Link
              to="/forget-password"
              className="text-blue-400 text-sm hover:text-blue-300"
            >
              Forgot Password?
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:scale-[1.02] transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing In...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-700"></div>
            <p className="text-gray-500 text-sm">OR</p>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          {/* Google */}
          <button className="w-full bg-white text-black py-3 rounded-xl font-medium hover:bg-gray-200 transition">
            Continue with Google
          </button>

          {/* Footer */}
          <p className="text-center text-gray-400 text-sm mt-6">
            Don’t have an account?
            <Link
              to="/register"
              className="text-blue-400 cursor-pointer hover:text-blue-300 ml-1"
            >
              Register
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - IMAGE */}
      <div className="w-full md:w-1/2 h-64 sm:h-80 md:h-screen">
        <img
          src="/image/logo.png"
          alt="Logo"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default Login;
