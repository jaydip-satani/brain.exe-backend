import bcrypt from "bcryptjs";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { db } from "../db/db.js";
import { UserRole } from "../generated/prisma/index.js";
import { emailVerificationMailGenContent, sendMail } from "../utils/mail.js";
import { generateVerificationToken } from "../utils/generate-verification-token.js";
const registerUser = asyncHandler(async (req, res) => {
  const { email, name, password } = req.body;

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
      `${process.env.BASE_URL}api/v1/users/emailVerify/${hashedToken}`
    ),
  });
  if (!mail) {
    return res.status(400).json(new ApiError(400, "Error while sending mail"));
  }
  return res.status(200).json(new ApiResponse(200, "User saved successfully"));
});

export { registerUser };
