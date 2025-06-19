import { ApiResponse } from "../utils/api-response.js";
const healthCheck = (req, res) => {
  res.json(new ApiResponse(200, "Server is running"));
};

export { healthCheck };
