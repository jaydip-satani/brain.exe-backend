import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/async-handler.js";
import { db } from "../db/db.js";
import { ApiResponse } from "../utils/api-response.js";

export const authMiddleware = asyncHandler(async (req, res, next) => {
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(401).json(new ApiResponse(401, "Unauthorized Access"));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await db.User.findUnique({
    where: {
      id: decoded.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    },
  });
  if (!user) {
    return res.status(404).json(new ApiResponse(404, "User not found"));
  }
  req.user = user;
  next();
});
