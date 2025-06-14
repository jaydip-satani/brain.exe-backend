import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  verifyEmail,
} from "../controllers/auth.controllers.js";
import { apiRateLimit } from "../middleware/apiRateLimiting.middleware.js";
import { validateSchema } from "../middleware/validateSchema.middleware.js";
import {
  UserRegisterSchema,
  UserloginSchema,
} from "../validators/auth.validators.js";
const router = Router();
router
  .route("/register")
  .post(apiRateLimit, validateSchema(UserRegisterSchema), registerUser);
router.route("/verifyEmail/:hashedToken").get(apiRateLimit, verifyEmail);
router
  .route("/login")
  .post(apiRateLimit, validateSchema(UserloginSchema), loginUser);
router.route("/logout").post(apiRateLimit, logoutUser);

export default router;
