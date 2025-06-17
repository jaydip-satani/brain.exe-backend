import { Router } from "express";
import { apiRateLimit } from "../middleware/apiRateLimiting.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { executeProblem } from "../controllers/executeProblem.controller.js";
const router = Router();
router.route("/").post(apiRateLimit, authMiddleware, executeProblem);
export default router;
