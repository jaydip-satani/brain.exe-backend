import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getAllSubmissions,
  getAllTheSubmissionsForProblem,
  getSubmissionForProblem,
} from "../controllers/submission.controller.js";
import { apiRateLimit } from "../middleware/apiRateLimiting.middleware.js";
const router = Router();
router
  .route("/get-all-submissions")
  .get(apiRateLimit, authMiddleware, getAllSubmissions);
router
  .route("/get-submission/:problemId")
  .get(apiRateLimit, authMiddleware, getSubmissionForProblem);
router
  .route("/get-submission-count/:problemId")
  .get(apiRateLimit, authMiddleware, getAllTheSubmissionsForProblem);
export default router;
