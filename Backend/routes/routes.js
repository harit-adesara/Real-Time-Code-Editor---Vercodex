import { Router } from "express";

const router = Router();

import {
  registerVal,
  loginVal,
  forgetPasswordValANDresnedRegisterVal,
  changePasswordVal,
  sendMessageVal,
  deleteForMeVal,
  runCodeVal,
  createFileValANDcreateFolderVal,
  updateVal,
  renameVal,
  createRoomVal,
  sendInviteVal,
  removeMemberVal,
  commitVal,
  restoreVal,
} from "../validator/index.js";

import {
  loginJWT,
  logOut,
  registerUser,
  verifyEmail,
  getCurrentUser,
  refreshAccessToken,
  forgotPasswordRequest,
  resetForgetPassword,
  changePassword,
  resendRegisterMail,
  addPassword,
} from "../controllers/auth.js";

import {
  sendMessage,
  getMessage,
  editMessage,
  deleteMessageEveryone,
  deleteForMe,
} from "../controllers/chatController.js";

import { runCodeController } from "../controllers/executionController.js";

import {
  createFile,
  createFolder,
  updateContent,
  renameNode,
  getTree,
  deleteNode,
} from "../controllers/nodeController.js";

import {
  createRoom,
  joinRoomPassword,
  sendInvitationToJoinRoom,
  getNotifications,
  getUnreadCount,
  markNotificationsRead,
  joinViaInvite,
  softDeleteNotification,
  removeMember,
  getTotalRoom,
  getUser,
  leaveRoom,
  getRoomDetail,
  getTotalUserInRoom,
} from "../controllers/roomController.js";

import {
  commitFile,
  restoreFile,
  commitGraph,
  commitHistory,
} from "../controllers/versioningController.js";

import {
  checkOptimization,
  streamChat,
  inlineSuggestions,
} from "../controllers/ai.js";

import { verifyJWT } from "../middleware/verifyJWT.js";
import { validate } from "../middleware/validate.js";

// auth routes

router.route("/login").post(loginVal(), validate, loginJWT); // done

router
  .route("/forgot-password")
  .post(
    forgetPasswordValANDresnedRegisterVal(),
    validate,
    forgotPasswordRequest,
  ); // done

router.route("/reset-password/:resetToken").post(resetForgetPassword); // done

router
  .route("/resend-register-email")
  .post(forgetPasswordValANDresnedRegisterVal(), validate, resendRegisterMail); // done

router.route("/register").post(registerVal(), validate, registerUser); // done

router.route("/refresh-token").post(refreshAccessToken); // done

router.route("/me").get(verifyJWT, getCurrentUser); //done

router.route("/logout").post(verifyJWT, logOut); //done

router
  .route("/change-password")
  .post(verifyJWT, changePasswordVal(), validate, changePassword); // done

router.route(`/verify/:verificationToken`).get(verifyEmail); // done

router.route("/oath-set-password").post(verifyJWT, addPassword);

// room routes

router
  .route("/room/create")
  .post(verifyJWT, createRoomVal(), validate, createRoom); // done

router.route("/room/join-password").post(verifyJWT, joinRoomPassword); // done

router.route("/room/join-invite").post(verifyJWT, joinViaInvite); // done

router
  .route("/room/invite")
  .post(verifyJWT, sendInviteVal(), validate, sendInvitationToJoinRoom); // done

router
  .route("/room/remove-member")
  .post(verifyJWT, removeMemberVal(), validate, removeMember); // done

router.route("/room/leave").post(verifyJWT, leaveRoom); // done

router.route("/room/detail").get(verifyJWT, getRoomDetail); // done

router.route("/room/users").get(verifyJWT, getTotalUserInRoom); // done

router.route("/rooms").get(verifyJWT, getTotalRoom); // done

// notification

router.route("/notifications").get(verifyJWT, getNotifications); // done

router.route("/notifications/unread-count").get(verifyJWT, getUnreadCount); // done

router
  .route("/notifications/mark-read")
  .patch(verifyJWT, markNotificationsRead); // done

router
  .route("/notifications/delete/:notificationId")
  .delete(verifyJWT, softDeleteNotification); // done

// getUser

router.route("/users/search").post(verifyJWT, getUser); // done

// chat routes

router
  .route("/send/message")
  .post(verifyJWT, sendMessageVal(), validate, sendMessage); // done

router.route("/get/message/:roomId").get(verifyJWT, getMessage); // done

router.route("/edit/message/:messageId").patch(verifyJWT, editMessage); // done

router
  .route("/delete/everyone/:roomId")
  .delete(verifyJWT, deleteMessageEveryone); // done

router
  .route("/delete/me")
  .patch(verifyJWT, deleteForMeVal(), validate, deleteForMe); // done

// file routes

router
  .route("/create/file")
  .post(verifyJWT, createFileValANDcreateFolderVal(), validate, createFile); // done

router
  .route("/create/folder")
  .post(verifyJWT, createFileValANDcreateFolderVal(), validate, createFolder); // done

router
  .route("/save/content")
  .post(verifyJWT, updateVal(), validate, updateContent); // done

router
  .route("/rename/node")
  .patch(verifyJWT, renameVal(), validate, renameNode); // done

router.route("/get/room/structure/:roomId").get(verifyJWT, getTree); // done

router.route("/node/delete/:nodeId").delete(verifyJWT, deleteNode); // done

// execution routes

router
  .route("/run/code")
  .post(verifyJWT, runCodeVal(), validate, runCodeController); // done

// versioning routes

router.route("/commit").post(verifyJWT, commitVal(), validate, commitFile); // done

router
  .route("/restore-version")
  .post(verifyJWT, restoreVal(), validate, restoreFile); // done

router.route("/commit/graph").get(verifyJWT, commitGraph); // done

router.route("/commit/history").get(verifyJWT, commitHistory); // done

// ai

router.route("/code/optimize").post(verifyJWT, checkOptimization);

router.route("/code/chatBot").post(verifyJWT, streamChat);

router.route("/code/inlineSuggestion").post(verifyJWT, inlineSuggestions);

export { router };
