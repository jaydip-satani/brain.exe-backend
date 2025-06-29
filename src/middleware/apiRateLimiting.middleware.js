import rateLimit from "express-rate-limit";
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyGenerator: (req) => req.ip + req.path,
  handler: (req, res) => {
    const remainingMs = req.rateLimit.resetTime - new Date();
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;

    res.status(429).json({
      success: false,
      status: 429,
      message: `Too many requests, please try again in ${formattedTime} minutes.`,
    });
  },
});

const runApiRateLimit = rateLimit({
  windowMs: 10 * 1000,
  max: 1,
  message: {
    success: false,
    status: 429,
    message: "Too many requests, please try again later.",
  },
  keyGenerator: (req) => {
    return req.ip + req.path; // Unique key for each IP and path
  },
});
const submitRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 2,
  message: {
    success: false,
    status: 429,
    message: "Too many requests, please try again later.",
  },
  keyGenerator: (req) => {
    return req.ip + req.path;
  },
});
export { apiRateLimit, runApiRateLimit, submitRateLimit };
