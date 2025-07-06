import { Router } from "express";
import { apiRateLimit } from "../middleware/apiRateLimiting.middleware.js";
import { authMiddleware, checkAdmin } from "../middleware/auth.middleware.js";
import {
  createProblem,
  deleteProblem,
  getAllProblems,
  getAllProblemSolvedByUser,
  getProblemById,
  getProblemBySlug,
  updateProblem,
} from "../controllers/problem.controller.js";
import { decryptBodyMiddleware } from "../middleware/decryptBody.middleware.js";
const router = Router();
router
  .route("/create-problem")
  .post(
    apiRateLimit,
    authMiddleware,
    checkAdmin,
    decryptBodyMiddleware,
    createProblem
  );
router.route("/problemset").get(getAllProblems);
router
  .route("/problemset/:id")
  .get(apiRateLimit, authMiddleware, getProblemById);
router.route("/problem/:slug").get(getProblemBySlug);
router
  .route("/update-problem/:id")
  .put(apiRateLimit, authMiddleware, checkAdmin, updateProblem);
router
  .route("/delete-problem/:id")
  .delete(apiRateLimit, authMiddleware, checkAdmin, deleteProblem);
router
  .route("/get-all-solved-by-user")
  .get(authMiddleware, getAllProblemSolvedByUser);

export default router;
