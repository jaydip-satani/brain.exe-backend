import { Router } from "express";
const router = Router();

import { registerUser } from "../controllers/auth.controllers.js";
import { apiRateLimit } from "../middleware/apiRateLimiting.middleware.js";
router.route("/register").post(apiRateLimit, registerUser);

export default router;
