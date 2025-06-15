import axios from "axios";
export const getJudge0LanguageId = (language) => {
  const languageMap = {
    javascript: 63,
    python: 71,
  };

  return languageMap[language.toLowerCase()];
};

export const submitBatch = async (submission) => {
  try {
    const { data } = await axios.post(
      `${process.env.JUDGE0_API_BASE_URL}/submissions/batch?base64_encoded=false`,
      { submissions: submission }
    );

    if (!Array.isArray(data)) {
      console.error("Unexpected response format from Judge0:", data);
      throw new Error("Expected Judge0 to return an array of tokens");
    }

    return data;
  } catch (err) {
    console.error("submitBatch error:", err.response?.data || err.message);
    throw err;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const pollBatchResults = async (tokens) => {
  if (!tokens || !tokens.length) throw new Error("No tokens provided");
  while (true) {
    const { data } = await axios.get(
      `${process.env.JUDGE0_API_BASE_URL}/submissions/batch`,
      {
        params: {
          tokens: tokens.join(","),
          base64_encoded: false,
        },
      }
    );
    const results = data.submissions;

    const isAllDone = results.every(
      (result) => result.status.id !== 1 && result.status.id !== 2
    );
    if (isAllDone) return results;
    await sleep(1000);
  }
};
