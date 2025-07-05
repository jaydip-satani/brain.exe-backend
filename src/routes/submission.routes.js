import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getAllSubmissions,
  getAllTheSubmissionsForProblem,
  getSubmissionForProblem,
} from "../controllers/submission.controller.js";
const router = Router();
router.route("/get-all-submissions").get(authMiddleware, getAllSubmissions);
router
  .route("/get-submission/:problemId")
  .get(authMiddleware, getSubmissionForProblem);
router
  .route("/get-submission-count/:problemId")
  .get(authMiddleware, getAllTheSubmissionsForProblem);
export default router;
