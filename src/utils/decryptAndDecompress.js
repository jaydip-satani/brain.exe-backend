import crypto from "crypto";
import zlib from "zlib";

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "utf-8");
const IV_LENGTH = 16;

export function decryptAndDecompress(buffer) {
  try {
    const iv = buffer.slice(0, IV_LENGTH);
    const encrypted = buffer.slice(IV_LENGTH);

    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    const decompressed = zlib.gunzipSync(decrypted);

    return JSON.parse(decompressed.toString("utf-8"));
  } catch (error) {
    console.error("❌ Decrypt/Decompress error:", error);
    throw new Error("Invalid encrypted payload");
  }
}
