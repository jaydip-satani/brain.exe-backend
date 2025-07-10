import express from "express";
import "dotenv/config";
import authRoutes from "./routes/auth.routes.js";
import problemRoutes from "./routes/problem.routes.js";
import executeRoutes from "./routes/executeProblem.routes.js";
import submissionRoutes from "./routes/submission.routes.js";
import problemSheetRoutes from "./routes/problemSheet.routes.js";
import cookieParser from "cookie-parser";
import { logger } from "./utils/logger.js";
import cors from "cors";
const app = express();
const PORT = process.env.PORT;
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://brainexe.jaydipsatani.com"],
    credentials: true,
  })
);
app.get("/", (req, res) => {
  res.send("hellooo");
});
app.use(cookieParser());
app.use(
  "/api/v1/auth",
  express.raw({ type: "application/octet-stream" }),
  authRoutes
);
app.use(
  "/api/v1/problem",
  express.raw({ type: "application/octet-stream" }),
  problemRoutes
);
app.use(
  "/api/v1/execute-problem",
  express.raw({ type: "application/octet-stream" }),
  executeRoutes
);
app.use("/api/v1/submission", submissionRoutes);
app.use("/api/v1/problem-sheet", problemSheetRoutes);
app.listen(PORT, () => logger.info(`Server started successfully on ${PORT}`));
