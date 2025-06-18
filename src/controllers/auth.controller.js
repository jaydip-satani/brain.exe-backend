import bcrypt from "bcryptjs";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { db } from "../db/db.js";
import { UserRole } from "../generated/prisma/index.js";
import { emailVerificationMailGenContent, sendMail } from "../utils/mail.js";
import { generateVerificationToken } from "../utils/generate-verification-token.js";
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

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json(new ApiError(401, "Invalid email or password"));
  }
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
export { registerUser, verifyEmail, loginUser, logoutUser, profile };
