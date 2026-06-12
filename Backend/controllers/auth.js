import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.js";
import crypto from "crypto";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
  forgotPasswordMailgenContent,
  sendEmail,
  registerEmail,
} from "../utils/mail.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const loginJWT = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(404, "email is required");
  }
  if (!password) {
    throw new ApiError(404, "Password is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.password) {
    throw new ApiError(404, "Login using oauth");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(404, "Authorize your email");
  }

  const check = await user.isPasswordCorrect(password);

  if (!check) {
    throw new ApiError(404, "Incorrect password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -isEmailVerified -refreshToken -forgetPasswordExpiry -forgetPasswordToken",
  );
  const accessTokenOptions = {
    httpOnly: true,
    sameSite: "None",
    secure: true,
    maxAge: 3 * 24 * 60 * 60 * 1000,
  };
  const refreshTokenOptions = {
    httpOnly: true,
    sameSite: "None",
    secure: true,
    maxAge: 15 * 24 * 60 * 60 * 1000,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenOptions)
    .cookie("refreshToken", refreshToken, refreshTokenOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged successfully",
      ),
    );
});

const logOut = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  user.refreshToken = "";
  await user.save({ validateBeforeSave: false });

  const options = {
    httpOnly: true,
    sameSite: "None",
    secure: true,
  };
  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, username } = req.body;

  if (!name || !email || !password || !username) {
    throw new ApiError(400, "Name, email,username and password are required");
  }

  let user = await User.findOne({ $or: [{ email }, { username }] });

  if (user) {
    throw new ApiError(409, "User already exists");
  }

  user = await User.create({
    name,
    email,
    password,
    username,
    isEmailVerified: false,
  });

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user.email,
    subject: "Verify your account",
    mailgenContent: registerEmail(
      user.name,
      `https://real-time-code-editor-vercodex.vercel.app/verify/${unHashedToken}`,
    ),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );

  return res
    .status(201)
    .json(
      new ApiResponse(201, { createdUser }, "User registered successfully"),
    );
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    throw new ApiError(400, "Email verification token is missing");
  }

  let hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Token is invalid or expired");
  }

  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;

  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isEmailVerified: true,
      },
      "Email is verified",
    ),
  );
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized user");
  }
  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  );

  if (!decodedToken) {
    throw new ApiError(401, "Not valid token");
  }

  const user = await User.findById(decodedToken?._id);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh token is invalid");
  }

  const accessTokenOptions = {
    httpOnly: true,
    sameSite: "None",
    secure: true,
    maxAge: 3 * 24 * 60 * 60 * 1000,
  };
  const refreshTokenOptions = {
    httpOnly: true,
    sameSite: "None",
    secure: true,
    maxAge: 15 * 24 * 60 * 60 * 1000,
  };

  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessAndRefreshToken(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenOptions)
    .cookie("refreshToken", newRefreshToken, refreshTokenOptions)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken: newRefreshToken, user },
        "Access token refreshed",
      ),
    );
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User does not exists");
  }
  if (!user.password) {
    throw new ApiError(404, "You have login through google");
  }
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();
  user.forgetPasswordToken = hashedToken;
  user.forgetPasswordExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Password reset request",
    mailgenContent: forgotPasswordMailgenContent(
      user.name,
      `https://real-time-code-editor-vercodex.vercel.app/reset-password/${unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset mail sent to your mail id"));
});

const resetForgetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.trim() === "") {
    throw new ApiError(404, "Give correct password");
  }

  let hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    forgetPasswordToken: hashedToken,
    forgetPasswordExpiry: { $gt: new Date() },
  });

  if (!user) {
    throw new ApiError(489, "Token is invalid or expired");
  }

  user.forgetPasswordToken = undefined;
  user.forgetPasswordExpiry = undefined;

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully changed"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);

  if (!user.password) {
    throw new ApiError(404, "You have login using google");
  }

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const resendRegisterMail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isEmailVerified) {
    throw new ApiError(404, "Email is already verified");
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save();

  await sendEmail({
    email: user.email,
    subject: "Verify your account",
    mailgenContent: registerEmail(
      user.name,
      `https://real-time-code-editor-vercodex.vercel.app/verify/${unHashedToken}`,
    ),
  });

  res.status(200).json(new ApiResponse(200, {}, "Invitation email resent"));
});

const addPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.oauthProvider || user.oauthProvider.length === 0) {
    throw new ApiError(400, "This account is not registered using OAuth");
  }

  if (user.password) {
    throw new ApiError(409, "Password already exists");
  }

  user.password = password;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password added successfully"));
});

export {
  loginJWT,
  logOut,
  generateAccessAndRefreshToken,
  registerUser,
  verifyEmail,
  getCurrentUser,
  refreshAccessToken,
  forgotPasswordRequest,
  resetForgetPassword,
  changePassword,
  resendRegisterMail,
  addPassword,
};
