import { Router } from "express";
import { apiRateLimit } from "../middleware/apiRateLimiting.middleware.js";
import { authMiddleware, checkAdmin } from "../middleware/auth.middleware.js";
import {
  createProblem,
  deleteProblem,
  getAllProblems,
  getProblemById,
  updateProblem,
} from "../controllers/problem.controllers.js";
const router = Router();
router
  .route("/create-problem")
  .post(apiRateLimit, authMiddleware, checkAdmin, createProblem);
router.route("/problemset").get(apiRateLimit, authMiddleware, getAllProblems);
router
  .route("/problemset/:id")
  .get(apiRateLimit, authMiddleware, getProblemById);
router
  .route("/update-problem/:id")
  .put(apiRateLimit, authMiddleware, checkAdmin, updateProblem);
router
  .route("/delete-problem/:id")
  .delete(apiRateLimit, authMiddleware, checkAdmin, deleteProblem);

export default router;
