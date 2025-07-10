import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  verifyEmail,
  profile,
  forgotPassword,
  resetPassword,
  userProfile,
} from "../controllers/auth.controller.js";
import { apiRateLimit } from "../middleware/apiRateLimiting.middleware.js";
import { validateSchema } from "../middleware/validateSchema.middleware.js";
import {
  UserRegisterSchema,
  UserloginSchema,
} from "../validators/auth.validators.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { decryptBodyMiddleware } from "../middleware/decryptBody.middleware.js";
const router = Router();
router
  .route("/register")
  .post(
    apiRateLimit,
    decryptBodyMiddleware,
    validateSchema(UserRegisterSchema),
    registerUser
  );
router.route("/verifyEmail/:hashedToken").get(apiRateLimit, verifyEmail);
router
  .route("/login")
  .post(
    apiRateLimit,
    decryptBodyMiddleware,
    validateSchema(UserloginSchema),
    loginUser
  );
router.route("/logout").get(apiRateLimit, authMiddleware, logoutUser);
router.route("/profile").post(authMiddleware, profile);
router.route("/userProfile/:userId").get(authMiddleware, userProfile);
router
  .route("/forgotPassword")
  .post(apiRateLimit, decryptBodyMiddleware, authMiddleware, forgotPassword);
router
  .route("/resetPassword")
  .post(apiRateLimit, decryptBodyMiddleware, authMiddleware, resetPassword);

export default router;
