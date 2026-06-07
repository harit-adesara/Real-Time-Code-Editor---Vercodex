import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Token not found");
    }

    const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decodeToken) {
      throw new ApiError(401, "Decoded token not found");
    }

    const user = await User.findById(decodeToken?._id).select(
      "-refreshToken -emailVerificationToken -emailVerificationExpiry -password -forgetPasswordToken -forgetPasswordExpiry",
    );

    if (!user) {
      throw new ApiError(401, "User not found");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(
      error.statusCode || 401,
      error.message || "Error in verify user",
    );
  }
});

export { verifyJWT };
