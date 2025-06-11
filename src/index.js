import express from "express";
import "dotenv/config";
import authRoutes from "./routes/auth.routes.js";
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
app.listen(PORT, () => logger.info(`Server started successfully on ${PORT}`));
