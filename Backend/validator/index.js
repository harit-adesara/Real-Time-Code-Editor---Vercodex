import { body } from "express-validator";

const registerVal = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Give correct email"),
    body("password").trim().notEmpty().withMessage("Password is required"),
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("username").trim().notEmpty().withMessage("Username is required"),
  ];
};

const loginVal = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Give correct email"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ];
};

const forgetPasswordValANDresnedRegisterVal = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Give correct email"),
  ];
};

const changePasswordVal = () => {
  return [
    body("oldPassword")
      .trim()
      .notEmpty()
      .withMessage("Give correct old password"),
    body("newPassword")
      .trim()
      .notEmpty()
      .withMessage("Give correct new password"),
  ];
};

const sendMessageVal = () => {
  return [
    body("roomId")
      .notEmpty()
      .withMessage("Room ID is required")
      .isMongoId()
      .withMessage("Invalid Room ID"),

    body("content")
      .notEmpty()
      .withMessage("Content is required")
      .isString()
      .withMessage("Content must be string"),
  ];
};

const deleteForMeVal = () => {
  return [
    body("roomId")
      .notEmpty()
      .withMessage("Room ID is required")
      .isMongoId()
      .withMessage("Invalid Room ID"),

    body("messageIds")
      .isArray({ min: 1 })
      .withMessage("At least one message ID is required"),

    body("messageIds.*").isMongoId().withMessage("Invalid message ID"),
  ];
};

const runCodeVal = () => {
  return [
    body("filename")
      .notEmpty()
      .withMessage("Filename is required")
      .isString()
      .withMessage("Filename must be string"),

    body("code")
      .notEmpty()
      .withMessage("Code is required")
      .isString()
      .withMessage("Code must be string"),

    body("stdin").optional().isString().withMessage("stdin must be string"),
  ];
};

const createFileValANDcreateFolderVal = () => {
  return [
    body("roomId")
      .notEmpty()
      .withMessage("Room ID is required")
      .isMongoId()
      .withMessage("Invalid Room ID"),
    body("parentId")
      .optional({ nullable: true })
      .isMongoId()
      .withMessage("Give correct ID"),
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isString()
      .withMessage("Name must be string"),
  ];
};

const updateVal = () => {
  return [
    body("nodeId")
      .trim()
      .notEmpty()
      .withMessage("Node Id is required")
      .isMongoId()
      .withMessage("Give correct ID"),
  ];
};

const renameVal = () => {
  return [
    body("nodeId")
      .trim()
      .notEmpty()
      .withMessage("Node Id is required")
      .isMongoId()
      .withMessage("Give correct ID"),
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isString()
      .withMessage("Give string"),
  ];
};

const createRoomVal = () => {
  return [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ];
};

const sendInviteVal = () => {
  return [
    body("roomId")
      .trim()
      .notEmpty()
      .withMessage("Room ID is required")
      .isMongoId()
      .withMessage("Give correct ID"),
    body("username").trim().notEmpty().withMessage("Username is required"),
  ];
};

const removeMemberVal = () => {
  return [
    body("roomId")
      .trim()
      .notEmpty()
      .withMessage("Room ID is required")
      .isMongoId()
      .withMessage("Give correct ID"),
    body("userId")
      .trim()
      .notEmpty()
      .withMessage("User ID is required")
      .isMongoId()
      .withMessage("Give correct ID"),
  ];
};

const commitVal = () => {
  return [
    body("nodeId")
      .trim()
      .notEmpty()
      .withMessage("Room ID is required")
      .isMongoId()
      .withMessage("Give correct ID"),

    body("content").trim().notEmpty().withMessage("Give content"),
    body("msg").trim().notEmpty().withMessage("Give commit message"),
  ];
};

const restoreVal = () => {
  return [
    body("nodeId")
      .trim()
      .notEmpty()
      .withMessage("Room ID is required")
      .isMongoId()
      .withMessage("Give correct ID"),

    body("commitNumber")
      .notEmpty()
      .withMessage("Commit number is required")
      .isNumeric()
      .withMessage("Give number"),
  ];
};

export {
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
};
