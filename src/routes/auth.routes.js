import { Router } from "express";
import { registerUser, verifyEmail } from "../controllers/auth.controllers.js";
import { apiRateLimit } from "../middleware/apiRateLimiting.middleware.js";
import { validateSchema } from "../middleware/validateSchema.middleware.js";
import { UserRegisterSchema } from "../validators/auth.validators.js";
const router = Router();
router
  .route("/register")
  .post(apiRateLimit, validateSchema(UserRegisterSchema), registerUser);
router.route("/verifyEmail/:hashedToken").get(apiRateLimit, verifyEmail);

export default router;
