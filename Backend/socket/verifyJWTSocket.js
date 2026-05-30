import { User } from "../models/user.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import cookie from "cookie";
import jwt from "jsonwebtoken";

const verifySocketJWT = asyncHandler(async (socket, next) => {
  try {
    const obj = cookie.parse(socket.handshake.headers.cookie);

    if (!obj) {
      throw new ApiError(404, "Token not found");
    }

    const token = obj.accessToken;

    if (!token) {
      throw new ApiError(404, "Token not found");
    }

    const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decodeToken) {
      throw new ApiError(404, "Decoded token not found");
    }

    const user = await User.findById(decodeToken?._id).select(
      "-refreshToken -emailVerificationToken -emailVerificationExpiry -password -forgetPasswordToken -forgetPasswordExpiry",
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    socket.user = user;

    next();
  } catch (error) {
    console.log(error);

    throw new ApiError(404, "Error in jwt verify");
  }
});

export { verifySocketJWT };
