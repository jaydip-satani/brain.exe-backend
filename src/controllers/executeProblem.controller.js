import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { db } from "../db/db.js";
import {
  getLanguageName,
  mapJudge0StatusToEnum,
  pollBatchResults,
  submitBatch,
} from "../utils/judge0.js";

export const executeProblem = asyncHandler(async (req, res) => {
  const { source_code, language_id, stdin, expectedOutput, problemId } =
    req.body;
  const userId = req.user.id;
  if (!userId) {
    return res.status(401).json(new ApiError(401, "Unauthorized access"));
  }
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

  let allCorrect = true;
  const detailedResults = results.map((result, index) => {
    const stdout = result.stdout?.trim();
    const expected_output = expectedOutput[index]?.trim();
    const correct = stdout === expected_output;
    console.log(typeof result.memory);
    console.log(typeof result.time);
    if (!correct) allCorrect = false;

    return {
      testCase: index + 1,
      correct,
      stdout,
      expected: expected_output,
      stderr: result.stderr?.trim() || null,
      compile_output: result.compile_output?.trim() || null,
      status: result.status.description,
      memory: result.memory || 0,
      time: result.time ? `${result.time} seconds` : null,
    };
  });
  console.log(detailedResults.some((res) => res.memory));
  const submissionData = await db.Submission.create({
    data: {
      userId,
      problemId,
      sourceCode: { [getLanguageName(language_id)]: source_code },
      language: getLanguageName(language_id),
      stdin: stdin.join("\n"),
      stdout: JSON.stringify(detailedResults.map((res) => res.stdout)),
      stderr: detailedResults.some((res) => res.stderr)
        ? JSON.stringify(detailedResults.map((res) => res.stderr))
        : null,
      compiledOutput: detailedResults.some((res) => res.compile_output)
        ? JSON.stringify(detailedResults.map((res) => res.compile_output))
        : null,
      status: mapJudge0StatusToEnum(results[0].status.description),
      memory: detailedResults.some((res) => res.memory) ? results[0].memory : 0,
      time: detailedResults.some((res) => res.time)
        ? JSON.stringify(detailedResults.map((res) => res.time))
        : null,
    },
  });

  if (allCorrect) {
    await db.ProblemSolved.upsert({
      where: {
        userId_problemId: {
          userId,
          problemId,
        },
      },
      update: {},
      create: {
        userId,
        problemId,
      },
    });
  }
  console.log(detailedResults.map((res) => res.status));

  const testcaseResults = detailedResults.map((result) => ({
    submissionId: submissionData.id,
    testCase: result.testCase,
    passed: result.correct,
    stdout: result.stdout,
    stderr: result.stderr,
    actualOutput: result.compile_output,
    status: mapJudge0StatusToEnum(result.status),
    memory: result.memory,
    time: result.time,
    expectedOutput: result.expected,
  }));
  await db.TestCaseResult.createMany({
    data: testcaseResults,
  });

  const submissionWithTestcases = await db.Submission.findUnique({
    where: { id: submissionData.id },
    include: { TestCaseResult: true },
  });
  res.status(200).json(
    new ApiResponse(200, "Code execution completed", {
      submission: submissionWithTestcases,
    })
  );
});

export const runCode = asyncHandler(async (req, res) => {
  const { source_code, language_id, stdin, expectedOutput, problemId } =
    req.body;
  const userId = req.user.id;
  if (!userId) {
    return res.status(401).json(new ApiError(401, "Unauthorized access"));
  }
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

  const detailedResults = results.map((result, index) => {
    const stdout = result.stdout?.trim();
    const expected_output = expectedOutput[index]?.trim();
    const correct = stdout === expected_output;
    console.log(typeof result.memory);
    console.log(typeof result.time);
    if (!correct) allCorrect = false;

    return {
      testCase: index + 1,
      correct,
      stdout,
      expected: expected_output,
      stderr: result.stderr?.trim() || null,
      compile_output: result.compile_output?.trim() || null,
      status: result.status.description,
      memory: result.memory || 0,
      time: result.time ? `${result.time} seconds` : null,
    };
  });

  res.status(200).json(
    new ApiResponse(200, "Code execution completed", {
      testCaseData: detailedResults,
    })
  );
});
