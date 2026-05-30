import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ForgetPassword = () => {
  let [email, setEmail] = useState("");
  let [error, setError] = useState("");
  let [message, setMessage] = useState("");
  let [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    console.log("submit clicked:", email);
    setError("");
    setMessage("");

    if (!email) {
      setError("⚠️ Email is required");
      return;
    }

    if (!email.includes("@")) {
      setError("⚠️ Enter a valid email");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/forgot-password",
        {
          email,
        },
      );

      setMessage("📩 Reset link sent to your email");
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(2,6,23)] px-4">
      <div className="w-full max-w-md bg-[rgba(15,23,42,0.8)] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Forgot Password
          </h1>
          <p className="text-gray-400 text-sm">
            Enter your email to reset password
          </p>
        </div>

        {/* Success */}
        {message && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">
            {message}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={(e) => submitHandler(e)}
          className="space-y-5"
          noValidate
        >
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[rgb(30,41,59)] text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 border border-transparent text-center"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:scale-[1.02] transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending Mail...
              </span>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        {/* Back */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Remember password?
          <Link to="/login" className="text-blue-400 ml-1 hover:text-blue-300">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgetPassword;
