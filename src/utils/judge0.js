import axios from "axios";
import { Status } from "../generated/prisma/index.js";

// Base64 helpers
const base64Encode = (text) => Buffer.from(text, "utf-8").toString("base64");
const base64Decode = (text) => Buffer.from(text, "base64").toString("utf-8");

// Language name → Judge0 ID
export const getJudge0LanguageId = (language) => {
  const languageMap = {
    javascript: 63,
    python: 71,
    java: 62,
    cpp: 54,
  };

  return languageMap[language.toLowerCase()] || -1;
};

// Judge0 ID → Language name
export const getLanguageName = (languageId) => {
  const languageMap = {
    63: "JavaScript",
    71: "Python",
    62: "Java",
    54: "Cpp",
  };

  return languageMap[languageId] || "Unknown Language";
};

// Submit batch of submissions to Judge0
export const submitBatch = async (submissions) => {
  try {
    const base64Submissions = submissions.map((sub) => ({
      source_code: base64Encode(sub.source_code),
      language_id: sub.language_id,
      stdin: base64Encode(sub.stdin),
    }));

    const { data } = await axios.post(
      `${process.env.JUDGE0_API_BASE_URL}/submissions/batch?base64_encoded=true`,
      { submissions: base64Submissions }
    );

    if (
      !Array.isArray(data) ||
      !data.every((d) => typeof d.token === "string")
    ) {
      console.error("Invalid response from Judge0:", data);
      throw new Error("Judge0 did not return valid submission tokens.");
    }

    return data;
  } catch (err) {
    console.error("submitBatch error:", err.response?.data || err.message);
    throw err;
  }
};

// Sleep helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Poll Judge0 until all tokens are done processing
export const pollBatchResults = async (tokens) => {
  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
    throw new Error("No valid Judge0 tokens provided to pollBatchResults");
  }

  if (tokens.some((t) => typeof t !== "string" || !t.trim())) {
    throw new Error("Some Judge0 tokens are invalid (non-string or empty)");
  }

  while (true) {
    try {
      const { data } = await axios.get(
        `${process.env.JUDGE0_API_BASE_URL}/submissions/batch`,
        {
          params: {
            tokens: tokens.join(","),
            base64_encoded: true,
          },
        }
      );

      if (!data || !Array.isArray(data.submissions)) {
        console.error("Unexpected Judge0 batch response:", data);
        throw new Error("Invalid batch results received from Judge0");
      }

      const results = data.submissions;
      const isAllDone = results.every(
        (result) => result.status?.id !== 1 && result.status?.id !== 2
      );

      if (isAllDone) {
        const decodedResults = results.map((res) => ({
          ...res,
          stdout: res.stdout ? base64Decode(res.stdout).trim() : null,
          stderr: res.stderr ? base64Decode(res.stderr).trim() : null,
          compile_output: res.compile_output
            ? base64Decode(res.compile_output).trim()
            : null,
        }));

        return decodedResults;
      }

      await sleep(1000);
    } catch (err) {
      console.error(
        "pollBatchResults error:",
        err.response?.data || err.message
      );
      throw err;
    }
  }
};

// Map Judge0 status text to Prisma enum
export const mapJudge0StatusToEnum = (description = "") => {
  const desc = description.toLowerCase();

  if (desc.includes("accepted")) return Status.ACCEPTED;
  if (desc.includes("wrong answer")) return Status.WRONG_ANSWER;
  if (desc.includes("compilation error")) return Status.COMPILATION_ERROR;
  if (desc.includes("runtime error")) return Status.RUNTIME_ERROR;
  if (desc.includes("time limit")) return Status.TIME_LIMIT_EXCEEDED;

  return Status.RUNTIME_ERROR;
};
