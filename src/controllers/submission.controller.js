import { db } from "../db/db.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllSubmissions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const submissions = await db.Submission.findMany({
    where: {
      userId: userId,
    },
  });
  return res.status(200).json(
    new ApiResponse(200, "All Submissions", {
      submissions: submissions,
    })
  );
});
const getSubmissionForProblem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const problemId = req.params.problemId;

  const submission = await db.Submission.findFirst({
    where: {
      userId: userId,
      problemId: problemId,
    },
  });
  return res.status(200).json(
    new ApiResponse(200, "Submission for problem", {
      submission: submission,
    })
  );
});
const getAllTheSubmissionsForProblem = asyncHandler(async (req, res) => {
  const problemId = req.params.problemId;
  const submissions = await db.Submission.count({
    where: {
      problemId: problemId,
    },
  });
  return res.status(200).json(
    new ApiResponse(200, "All Submissions for problem", {
      count: submissions,
    })
  );
});

export {
  getAllSubmissions,
  getSubmissionForProblem,
  getAllTheSubmissionsForProblem,
};
