import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ResendVerification = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleResend = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("⚠️ Please enter your email");
      return;
    }

    if (!email.includes("@")) {
      setError("⚠️ Enter a valid email");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/resend-register-email",
        { email },
        { withCredentials: true },
      );

      setSuccess("📩 Verification email sent successfully!");
      setEmail("");
    } catch (err) {
      setError("❌ Failed to resend email. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(2,6,23)] relative overflow-hidden">
      {/* Glow UI */}
      <div className="absolute w-72 h-72 bg-blue-500/20 rounded-full blur-3xl top-10 left-10"></div>
      <div className="absolute w-72 h-72 bg-purple-500/20 rounded-full blur-3xl bottom-10 right-10"></div>

      <div className="w-full max-w-md bg-[rgba(15,23,42,0.8)] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl z-10">
        {/* Title */}
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Resend Verification
        </h1>
        <p className="text-gray-400 text-center mb-6">
          Enter your email to receive verification link
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleResend} className="space-y-5">
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[rgb(30,41,59)] text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 border border-transparent"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:scale-[1.02] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Resend Email"}
          </button>
        </form>

        {/* Links */}
        <div className="flex justify-between mt-6 text-sm text-gray-400">
          <Link to="/login" className="hover:text-blue-400">
            Back to Login
          </Link>

          <Link to="/register" className="hover:text-blue-400">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResendVerification;
