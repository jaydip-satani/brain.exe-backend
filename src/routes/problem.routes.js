import { Router } from "express";
import { apiRateLimit } from "../middleware/apiRateLimiting.middleware.js";
import { authMiddleware, checkAdmin } from "../middleware/auth.middleware.js";
import { createProblem } from "../controllers/problem.controllers.js";
const router = Router();
router
  .route("/create-problem")
  .post(apiRateLimit, authMiddleware, checkAdmin, createProblem);

export default router;
