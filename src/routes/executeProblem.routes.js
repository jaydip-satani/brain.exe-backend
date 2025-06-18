import { Router } from "express";
import {
  runApiRateLimit,
  submitRateLimit,
} from "../middleware/apiRateLimiting.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  executeProblem,
  runCode,
} from "../controllers/executeProblem.controller.js";
const router = Router();
router.route("/").post(submitRateLimit, authMiddleware, executeProblem);
router.route("/run").post(runApiRateLimit, authMiddleware, runCode);
export default router;
