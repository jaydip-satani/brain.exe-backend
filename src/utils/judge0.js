import axios from "axios";
export const getJudge0LanguageId = (language) => {
  const languageMap = {
    "Assembly (NASM 2.14.02)": 45,
    "Bash (5.0.0)": 46,
    "Basic (FBC 1.07.1)": 47,
    "C (Clang 7.0.1)": 75,
    "C++ (Clang 7.0.1)": 76,
    "C (GCC 7.4.0)": 48,
    "C++ (GCC 7.4.0)": 52,
    "C (GCC 8.3.0)": 49,
    "C++ (GCC 8.3.0)": 53,
    "C (GCC 9.2.0)": 50,
    "C++ (GCC 9.2.0)": 54,
    "Clojure (1.10.1)": 86,
    "C# (Mono 6.6.0.161)": 51,
    "COBOL (GnuCOBOL 2.2)": 77,
    "Common Lisp (SBCL 2.0.0)": 55,
    "D (DMD 2.089.1)": 56,
    "Elixir (1.9.4)": 57,
    "Erlang (OTP 22.2)": 58,
    "F# (.NET Core SDK 3.1.202)": 87,
    "Fortran (GFortran 9.2.0)": 59,
    "Go (1.13.5)": 60,
    "Groovy (3.0.3)": 88,
    "Haskell (GHC 8.8.1)": 61,
    "Java (OpenJDK 13.0.1)": 62,
    "JavaScript (Node.js 12.14.0)": 63,
    "Kotlin (1.3.70)": 78,
    "Lua (5.3.5)": 64,
    "Multi-file program": 89,
    "Objective-C (Clang 7.0.1)": 79,
    "OCaml (4.09.0)": 65,
    "Octave (5.1.0)": 66,
    "Pascal (FPC 3.0.4)": 67,
    "Perl (5.28.1)": 85,
    "PHP (7.4.1)": 68,
    "Plain Text": 43,
    "Prolog (GNU Prolog 1.4.5)": 69,
    "Python (2.7.17)": 70,
    "Python (3.8.1)": 71,
    "R (4.0.0)": 80,
    "Ruby (2.7.0)": 72,
    "Rust (1.40.0)": 73,
    "Scala (2.13.2)": 81,
    "SQL (SQLite 3.27.2)": 82,
    "Swift (5.2.3)": 83,
    "TypeScript (3.7.4)": 74,
    "Visual Basic.Net (vbnc 0.0.0.5943)": 84,
  };

  return languageMap[language.toUpperCase()];
};

export const submitBatch = async (submission) => {
  const { data } = await axios.post(
    `${process.env.JUDGE0_API_BASE_URL}/submissions/batch?base64_encoded=false`,
    { submission }
  );
  console.log(data);
  return data;
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
