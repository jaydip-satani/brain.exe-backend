import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { db } from "../db/db.js";
import {
  getJudge0LanguageId,
  submitBatch,
  pollBatchResults,
} from "../utils/judge0.js";

const createProblem = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    examples,
    constraints,
    testcases,
    codeSnippets,
    referenceSolutions,
  } = req.body;

  try {
    for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
      const languageId = getJudge0LanguageId(language);
      if (!languageId) {
        return res.status(400).json(new ApiError(400, "Invalid language"));
      }

      const submission = testcases.map(({ input, output }) => ({
        source_code: solutionCode,
        language_id: languageId,
        stdin: input,
        expected_output: output,
      }));

      const submissionResult = await submitBatch(submission);
      const tokens = submissionResult.map((res) => res.token);
      const results = await pollBatchResults(tokens);

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        console.log("Result", result);
        if (result.status.id !== 3)
          return res
            .status(400)
            .json(
              new ApiError(400, "Submission failed", [
                { error: `Testcase ${i + 1} failed for language ${language}` },
              ])
            );
      }
      const newProblem = await db.Problem.create({
        data: {
          title,
          description,
          difficulty,
          tags,
          examples,
          constraints,
          testcases,
          codeSnippets,
          referenceSolutions,
          userId: req.user.id,
        },
      });
      console.log(newProblem);
      return res
        .status(201)
        .json(new ApiResponse(201, "Problem created", newProblem));
    }
  } catch (error) {
    console.error("CreateProblem Error:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal server error", [{ error: error }]));
  }
});

const getAllProblems = asyncHandler(async (req, res) => {
  const problems = await db.Problem.findMany();
  if (!problems)
    return res.status(404).json(new ApiError(404, "No problems found"));
  return res.status(200).json(new ApiResponse(200, "All problems", problems));
});

const getProblemById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const problem = await db.Problem.findUnique({
    where: { id },
  });
  if (!problem)
    return res.status(404).json(new ApiError(404, "Problem not found"));
  return res.status(200).json(new ApiResponse(200, "Problem found", problem));
});

export { createProblem, getAllProblems, getProblemById };
