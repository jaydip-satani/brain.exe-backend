import { decryptAndDecompress } from "../utils/decryptAndDecompress.js";

export const decryptBodyMiddleware = async (req, res, next) => {
  try {
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ error: "Expected binary encrypted body" });
    }

    const decryptedPayload = await decryptAndDecompress(req.body);
    req.body = decryptedPayload; // Replace raw buffer with decrypted object

    next();
  } catch (error) {
    console.error("Decryption failed:", error);
    return res.status(400).json({ error: "Failed to decrypt or parse body" });
  }
};
