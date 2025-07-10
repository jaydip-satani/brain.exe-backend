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
import { decryptBodyMiddleware } from "../middleware/decryptBody.middleware.js";
const router = Router();
router
  .route("/")
  .post(submitRateLimit, authMiddleware, decryptBodyMiddleware, executeProblem);
router
  .route("/run")
  .post(runApiRateLimit, authMiddleware, decryptBodyMiddleware, runCode);
export default router;
