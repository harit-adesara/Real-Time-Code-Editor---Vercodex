import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {
  BrowserRouter,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Router,
  RouterProvider,
} from "react-router-dom";

import { AuthProvider } from "./context/Auth.jsx";

import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import ForgetPassword from "./pages/ForgetPassword.jsx";
import Landing from "./pages/Landing.jsx";
import Layout from "./pages/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Notifications from "./pages/Notification.jsx";
import Room from "./pages/Room.jsx";
import RoomDetails from "./pages/RoomDetails.jsx";
import CreateRoom from "./pages/CreateRoom.jsx";
import JoinRoom from "./pages/JoinRoom.jsx";
import SearchUser from "./pages/SearchUser.jsx";
import Profile from "./pages/Profile.jsx";
import Guidelines from "./pages/Guidelines.jsx";
import Chat from "./editor/Chat.jsx";
import EditorPage from "./editor/EditorPage.jsx";
import ProtectedRoute from "./ProtectedRoutes/ProtectedRoutes.jsx";
import PublicRoute from "./ProtectedRoutes/PublicRoutes.jsx";
import ResetPassword from "./pages/ResetForgetPassword.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Guidelines />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="my-rooms" element={<Room />} />
          <Route path="my-rooms/details/:roomId" element={<RoomDetails />} />
          <Route path="create-room" element={<CreateRoom />} />
          <Route path="join-room" element={<JoinRoom />} />
          <Route path="search-user" element={<SearchUser />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/editor/:roomId" element={<EditorPage />} />
        <Route path="/chat/:roomId" element={<Chat />} />
      </Route>
      <Route element={<PublicRoute />}>
        <Route path="/verify/:verificationToken" element={<VerifyEmail />} />
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
      </Route>
    </>,
  ),
);

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>,
);
