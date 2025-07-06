import { Router } from "express";
import { apiRateLimit } from "../middleware/apiRateLimiting.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  addProblemToProblemSheet,
  createProblemSheet,
  deleteProblemFromProblemSheet,
  deleteProblemSheet,
  getAllProblemSheets,
  getProblemSheetDetails,
  updateProblemSheet,
} from "../controllers/problemSheet.controller.js";
const router = Router();
router.route("/").get(apiRateLimit, authMiddleware, getAllProblemSheets);
router
  .route("/:sheetId")
  .get(apiRateLimit, authMiddleware, getProblemSheetDetails);
router
  .route("/create-sheet")
  .post(apiRateLimit, authMiddleware, createProblemSheet);
router
  .route("/delete-sheet/:sheetId")
  .get(apiRateLimit, authMiddleware, deleteProblemSheet);
router
  .route("/update-sheet/:sheetId")
  .patch(apiRateLimit, authMiddleware, updateProblemSheet);
router
  .route("/:sheetId/add-problem")
  .post(apiRateLimit, authMiddleware, addProblemToProblemSheet);
router
  .route("/:sheetId/delete-problem")
  .delete(apiRateLimit, authMiddleware, deleteProblemFromProblemSheet);

export default router;
