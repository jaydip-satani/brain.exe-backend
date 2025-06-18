import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  verifyEmail,
  profile,
} from "../controllers/auth.controller.js";
import { apiRateLimit } from "../middleware/apiRateLimiting.middleware.js";
import { validateSchema } from "../middleware/validateSchema.middleware.js";
import {
  UserRegisterSchema,
  UserloginSchema,
} from "../validators/auth.validators.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
const router = Router();
router
  .route("/register")
  .post(apiRateLimit, validateSchema(UserRegisterSchema), registerUser);
router.route("/verifyEmail/:hashedToken").get(apiRateLimit, verifyEmail);
router
  .route("/login")
  .post(apiRateLimit, validateSchema(UserloginSchema), loginUser);
router.route("/logout").get(apiRateLimit, authMiddleware, logoutUser);
router.route("/profile").post(apiRateLimit, authMiddleware, profile);

export default router;
