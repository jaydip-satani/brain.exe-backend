import bcrypt from "bcryptjs";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { db } from "../db/db.js";
import { UserRole } from "../generated/prisma/index.js";
import {
  emailVerificationMailGenContent,
  sendMail,
  forgotPasswordMailGenContent,
} from "../utils/mail.js";
import { generateVerificationToken } from "../utils/generateVerificationToken.js";
import jwt from "jsonwebtoken";
import "dotenv/config";

const registerUser = asyncHandler(async (req, res) => {
  const { email, name, password, confirmPassword } = req.body;
  if (!email || !name || !password || !confirmPassword) {
    return res
      .status(400)
      .json(new ApiResponse(400, "All fields are required."));
  }
  if (password !== confirmPassword) {
    return res
      .status(400)
      .json(new ApiResponse(400, "Passwords do not match."));
  }
  const existingUser = await db.User.findUnique({
    where: {
      email,
    },
  });
  if (existingUser) {
    return res
      .status(400)
      .json(new ApiResponse(400, "User is already exists."));
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const { hashedToken, tokenExpiry } = generateVerificationToken();
  const user = await db.User.create({
    data: {
      email,
      password: hashedPassword,
      name,
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: tokenExpiry,
      role: UserRole.USER,
    },
  });
  if (!user) {
    return res.json(new ApiResponse(400, "Error while creating user.."));
  }
  const mail = await sendMail({
    email: email,
    subject: "Verify your email",
    mailGenContent: emailVerificationMailGenContent(
      name,
      `${process.env.BASE_URL}/api/v1/auth/verifyEmail/${hashedToken}`
    ),
  });
  if (!mail) {
    return res.status(400).json(new ApiError(400, "Error while sending mail"));
  }
  return res.status(200).json(new ApiResponse(200, "User saved successfully"));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { hashedToken } = req.params;
  const user = await db.User.findFirst({
    where: {
      emailVerificationToken: hashedToken,
    },
  });
  if (!user) {
    return res
      .status(400)
      .json(new ApiError(400, "Invalid token", [{ token: hashedToken }]));
  }
  if (user.userVerified) {
    return res.status(200).json(new ApiResponse(200, "Already Verified"));
  }
  if (user.emailVerificationExpiry < new Date()) {
    return res
      .status(400)
      .json(new ApiError(400, "Token expired", [{ token: hashedToken }]));
  }
  await db.User.update({
    where: {
      id: user.id,
    },
    data: {
      emailVerificationToken: null,
      emailVerificationExpiry: null,
      userVerified: true,
    },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, "Email verified successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json(new ApiError(400, "All Field is required"));
  }
  const user = await db.User.findUnique({
    where: {
      email: email,
    },
  });
  if (!user) {
    return res.status(400).json(new ApiError(400, "Please register first"));
  }
  if (!user.userVerified) {
    return res.status(401).json(new ApiError(401, "Please verify your email"));
  }
  if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
    const remainingMinutes = Math.ceil(
      (user.accountLockedUntil.getTime() - new Date().getTime()) / 60000
    );
    return res
      .status(403)
      .json(
        new ApiError(
          403,
          `Account is locked. Try again in ${remainingMinutes} minute(s).`
        )
      );
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    let updateData = {
      failedLoginAttempts: user.failedLoginAttempts + 1,
    };

    if (user.failedLoginAttempts + 1 >= 5) {
      updateData.accountLockedUntil = new Date(Date.now() + 60 * 60 * 1000);
      updateData.failedLoginAttempts = 0;
    }

    await db.User.update({
      where: { id: user.id },
      data: updateData,
    });

    return res.status(400).json(new ApiError(400, "Invalid credentials"));
  }
  await db.User.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      accountLockedUntil: null,
      lastLogin: new Date(),
    },
  });
  const payload = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TOKEN_EXPIRY,
  });
  const cookieOption = {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  res.cookie("authToken", payload, cookieOption);
  return res.status(200).json(new ApiResponse(200, "user login successfull"));
});

const logoutUser = asyncHandler(async (req, res) => {
  const cookieOption = {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };
  res.clearCookie("authToken", cookieOption);
  return res.status(200).json(new ApiResponse(200, "user logout successfull"));
});

const profile = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, "user profile", req.user));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json(new ApiError(400, "email is required"));
  }
  const user = await db.User.findUnique({
    where: {
      email: email,
    },
  });
  if (!user) {
    return res.status(400).json(new ApiError(400, "No user found"));
  }
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.FORGOT_PASSWORD_EXPIRY,
  });
  const mail = await sendMail({
    email: email,
    subject: "Forgot password link",
    mailGenContent: forgotPasswordMailGenContent(
      email,
      `${process.env.ORIGIN_URL}/reset-password/${token}`
    ),
  });
  if (!mail) {
    return res.status(400).json(new ApiError(400, "Error while sending mail"));
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "The reset link has been sent to your email address."
      )
    );
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    return res.status(400).json(new ApiError(400, "All field required."));
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json(new ApiError(400, "Password do not match"));
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res
      .status(401)
      .json(new ApiResponse(401, "Invalid or expired token"));
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const user = await db.User.update({
    where: {
      id: decoded.id,
    },
    data: {
      password: hashedPassword,
    },
  });
  if (!user) {
    return res
      .status(400)
      .json(new ApiResponse(401, "Error while changing password"));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Password has been reset successfully."));
});

export {
  registerUser,
  verifyEmail,
  loginUser,
  logoutUser,
  profile,
  forgotPassword,
  resetPassword,
};
