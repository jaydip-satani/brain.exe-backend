import rateLimit from "express-rate-limit";

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    sucess: false,
    status: 429,
    message: "Too many requests, please try again later.",
  },
  keyGenerator: (req) => {
    return req.ip + req.path;
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
