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
  const existingUser = await db.User.findFirst({
    where: {
      OR: [{ email }, { name }],
    },
  });
  if (existingUser) {
    if (existingUser.email === email) {
      return res.status(400).json(new ApiResponse(400, "Email is taken."));
    }

    if (existingUser.name === name) {
      return res.status(400).json(new ApiResponse(400, "name is taken."));
    }
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
    return res.status(400).json(new ApiError(400, "All fields are required"));
  }

  const user = await db.User.findUnique({ where: { email } });

  if (!user) {
    return res
      .status(400)
      .json(new ApiError(400, "User not found. Please register."));
  }

  if (!user.userVerified) {
    if (user.emailVerificationExpiry < new Date()) {
      const { hashedToken, tokenExpiry } = generateVerificationToken();
      await db.User.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: hashedToken,
          emailVerificationExpiry: tokenExpiry,
        },
      });
      const mail = await sendMail({
        email: user.email,
        subject: "Verify your email",
        mailGenContent: emailVerificationMailGenContent(
          user.name,
          `${process.env.BASE_URL}/api/v1/auth/verifyEmail/${hashedToken}`
        ),
      });

      if (!mail) {
        return res
          .status(500)
          .json(new ApiError(500, "Failed to send verification email."));
      }

      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            "Your verification link had expired. A new one has been sent to your email."
          )
        );
    }

    return res
      .status(401)
      .json(new ApiError(401, "Please verify your email before logging in."));
  }

  if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
    const remainingMinutes = Math.ceil(
      (user.accountLockedUntil.getTime() - Date.now()) / 60000
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

  if (!user.password) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          "This account was created using Google. Please login with Google or reset your password."
        )
      );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    let updateData = {
      failedLoginAttempts: user.failedLoginAttempts + 1,
    };

    if (updateData.failedLoginAttempts >= 5) {
      updateData.accountLockedUntil = new Date(Date.now() + 60 * 60 * 1000); // Lock for 1 hour
      updateData.failedLoginAttempts = 0;
    }

    await db.User.update({
      where: { id: user.id },
      data: updateData,
    });

    return res.status(400).json(new ApiError(400, "Invalid credentials."));
  }

  await db.User.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      accountLockedUntil: null,
      lastLogin: new Date(),
    },
  });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TOKEN_EXPIRY,
  });

  const cookieOption = {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res.cookie("authToken", token, cookieOption);

  return res
    .status(200)
    .json(new ApiResponse(200, "User logged in successfully"));
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

const userProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json(new ApiError(400, "Invalid user id"));
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Problem: true,
        ProblemSolved: {
          include: {
            problem: true,
          },
        },
        Submission: {
          include: {
            problem: true,
            TestCaseResult: true,
          },
        },
        ProblemSheet: {
          include: {
            problems: {
              include: {
                problem: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const transformedSheets = user.ProblemSheet.map((sheet) => ({
      id: sheet.id,
      name: sheet.name,
      description: sheet.description,
      createdAt: sheet.createdAt,
      problems: sheet.problems.map((p) => p.problem),
    }));

    return res.status(200).json(
      new ApiResponse(200, "user data fetched", {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          verified: user.userVerified,
        },
        problemsSolved: user.ProblemSolved.map((s) => s.problem),
        submissions: user.Submission,
        problemSheets: transformedSheets,
      })
    );
  } catch (err) {
    console.error("Error fetching full user data:", err);
    res.status(500).json({ error: "Internal server error" });
  }
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
  userProfile,
};
