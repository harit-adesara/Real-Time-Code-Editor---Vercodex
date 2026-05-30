import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Register = () => {
  let [username, setUsername] = useState("");
  let [name, setName] = useState("");
  let [email, setEmail] = useState("");
  let [password, setPassword] = useState("");
  let [error, setError] = useState("");
  let [success, setSuccess] = useState("");
  let [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !name || !email || !password) {
      setError("⚠️ Please fill all fields");
      return;
    }

    if (!email.includes("@")) {
      setError("⚠️ Enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/register",
        {
          email,
          password,
          username,
          name,
        },
        {
          withCredentials: true,
        },
      );

      setSuccess("Registration successful, verification mail sent to you 🎉");
      setEmail("");
      setPassword("");
      setUsername("");
      setName("");
      setError("");
      setLoading(false);
    } catch (error) {
      setError("❌ Registration failed. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[rgb(2,6,23)]">
      {/* Glow */}
      <div className="absolute w-72 h-72 bg-blue-500/20 rounded-full blur-3xl top-10 left-10"></div>
      <div className="absolute w-72 h-72 bg-purple-500/20 rounded-full blur-3xl bottom-10 right-10"></div>

      {/* LEFT SIDE - FORM */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-10 relative z-10">
        <div className="w-full max-w-md bg-[rgba(15,23,42,0.8)] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Heading */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Create Account
            </h1>
            <p className="text-gray-400">Join Vercodex today</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => submitHandler(e)}
            className="space-y-5"
            noValidate
          >
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[rgb(30,41,59)] text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 border border-transparent"
            />

            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[rgb(30,41,59)] text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 border border-transparent"
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[rgb(30,41,59)] text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 border border-transparent"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[rgb(30,41,59)] text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 border border-transparent"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:scale-[1.02] transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-700"></div>
            <p className="text-gray-500 text-sm">OR</p>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          {/* Login link */}
          <p className="text-center text-gray-400 text-sm">
            Already have an account?
            <Link
              to="/login"
              className="text-blue-400 ml-1 hover:text-blue-300"
            >
              Login
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

export default Register;
