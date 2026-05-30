import React, { useEffect, useState } from "react";
import axios from "axios";

const Profile = () => {
  const [user, setUser] = useState(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [addPassword, setAddPassword] = useState("");

  const [status, setStatus] = useState("");

  // toggle dropdowns
  const [showPasswordBox, setShowPasswordBox] = useState(false);
  const [showAddPasswordBox, setShowAddPasswordBox] = useState(false);

  // GET CURRENT USER
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          "https://real-time-code-editor-vercodex.onrender.com/vercodex/me",
          {
            withCredentials: true,
          },
        );

        setUser(res.data.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchUser();
  }, []);

  // CHANGE PASSWORD
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setStatus("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("New passwords do not match");
      return;
    }

    try {
      await axios.post(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/change-password",
        {
          oldPassword,
          newPassword,
        },
        { withCredentials: true },
      );

      setStatus("Password changed successfully");

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => setStatus(""), 8000);
    } catch (err) {
      setStatus("Failed to change password");
      setTimeout(() => setStatus(""), 8000);
    }
  };

  // ADD PASSWORD (OAuth users)
  const handleAddPassword = async () => {
    if (!addPassword) {
      setStatus("Password is required");
      return;
    }

    try {
      await axios.post(
        "https://real-time-code-editor-vercodex.onrender.com/vercodex/oauth-set-password",
        { password: addPassword },
        { withCredentials: true },
      );

      setStatus("Password added successfully");

      setAddPassword("");

      setTimeout(() => setStatus(""), 8000);
    } catch (err) {
      setStatus("Failed to add password");
      setTimeout(() => setStatus(""), 8000);
    }
  };

  if (!user) {
    return <div className="text-white p-6">Loading profile...</div>;
  }

  return (
    <div className="text-white p-6 max-w-3xl mx-auto">
      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      {/* USER INFO CARD */}
      <div className="bg-[rgb(15,23,42)] border border-white/10 p-6 rounded-2xl space-y-4">
        <div>
          <p className="text-gray-400">Full Name</p>
          <p className="text-lg font-semibold">{user.name}</p>
        </div>

        <div>
          <p className="text-gray-400">Username</p>
          <p className="text-lg font-semibold">{user.username}</p>
        </div>

        <div>
          <p className="text-gray-400">Email</p>
          <p className="text-lg font-semibold">{user.email}</p>
        </div>

        <div>
          <p className="text-gray-400">Email Verification</p>
          <p
            className={`font-semibold ${
              user.isEmailVerified ? "text-green-400" : "text-red-400"
            }`}
          >
            {user.isEmailVerified ? "Verified" : "Not Verified"}
          </p>
        </div>
      </div>

      {/* CHANGE PASSWORD SECTION */}
      <div className="mt-8 bg-[rgb(15,23,42)] border border-white/10 p-6 rounded-2xl">
        <button
          onClick={() => setShowPasswordBox(!showPasswordBox)}
          className="text-xl font-bold mb-4 flex items-center justify-between w-full"
        >
          Change Password
          <span className="text-sm text-gray-400">
            {showPasswordBox ? "▲" : "▼"}
          </span>
        </button>

        {showPasswordBox && (
          <div className="mt-4">
            <input
              type="password"
              placeholder="Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full p-3 mb-3 rounded-xl bg-[rgb(2,6,23)] border border-white/10"
            />

            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 mb-3 rounded-xl bg-[rgb(2,6,23)] border border-white/10"
            />

            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 mb-4 rounded-xl bg-[rgb(2,6,23)] border border-white/10"
            />

            <button
              onClick={handleChangePassword}
              className="px-5 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors w-full"
            >
              Update Password
            </button>

            {status && <p className="mt-3 text-sm text-gray-300">{status}</p>}
          </div>
        )}
      </div>

      {/* ADD PASSWORD SECTION (NEW) */}
      <div className="mt-8 bg-[rgb(15,23,42)] border border-white/10 p-6 rounded-2xl">
        <button
          onClick={() => setShowAddPasswordBox(!showAddPasswordBox)}
          className="text-xl font-bold mb-4 flex items-center justify-between w-full"
        >
          Add Password
          <span className="text-sm text-gray-400">
            {showAddPasswordBox ? "▲" : "▼"}
          </span>
        </button>

        {showAddPasswordBox && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-3">
              Use this field if you have logged in with Google
            </p>
            <input
              type="password"
              placeholder="Set Password"
              value={addPassword}
              onChange={(e) => setAddPassword(e.target.value)}
              className="w-full p-3 mb-4 rounded-xl bg-[rgb(2,6,23)] border border-white/10"
            />

            <button
              onClick={handleAddPassword}
              className="px-5 py-3 bg-green-500 rounded-xl hover:bg-green-600 transition-colors w-full"
            >
              Add Password
            </button>

            {status && <p className="mt-3 text-sm text-gray-300">{status}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
