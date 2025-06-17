import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { pollBatchResults, submitBatch } from "../utils/judge0.js";

export const executeProblem = asyncHandler(async (req, res) => {
  const { source_code, language_id, stdin, expectedOutput, problemId } =
    req.body;
  const { userId } = req.user;

  if (!source_code || !language_id || !stdin || !expectedOutput || !problemId) {
    return res.status(400).json(new ApiError(400, "All fields are required"));
  }

  if (
    !Array.isArray(stdin) ||
    stdin.length === 0 ||
    !Array.isArray(expectedOutput) ||
    expectedOutput.length !== stdin.length
  ) {
    return res
      .status(400)
      .json(new ApiError(400, "Invalid or missing test cases"));
  }

  const submission = stdin.map((input) => ({
    source_code,
    language_id,
    stdin: input,
  }));

  const submitResponse = await submitBatch(submission);
  const tokens = submitResponse.map((res) => res.token);

  const results = await pollBatchResults(tokens);
  console.log(results);

  res.status(200).json(new ApiResponse(200, "Batch execution completed"));
});
