import rateLimit from "express-rate-limit";

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    sucess: false,
    status: 429,
    error: "Too many requests, please try again later.",
  },
  keyGenerator: (req) => {
    return req.ip + req.path;
  },
});

export { apiRateLimit };
