import express from "express";
import "dotenv/config";
import authRoutes from "./routes/auth.routes.js";
import problemRoutes from "./routes/problem.routes.js";
import executeRoutes from "./routes/executeProblem.routes.js";
import cookieParser from "cookie-parser";
import { logger } from "./utils/logger.js";
const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.get("/", (req, res) => {
  res.send("hellooo");
});
app.use(cookieParser());
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/problem", problemRoutes);
app.use("/api/v1/execute-problem", executeRoutes);
app.listen(PORT, () => logger.info(`Server started successfully on ${PORT}`));
