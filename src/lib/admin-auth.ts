
import { createHmac, timingSafeEqual } from "crypto";

export function isValidAdminSession(
  token: string | undefined,
): boolean {
  if (!token) return false;

  const secret = process.env.ADMIN_SESSION_SECRET;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!secret || !adminEmail) return false;

  const parts = token.split("|");

  if (parts.length !== 3) return false;

  const [email, expiresAtString, signature] = parts;
  const expiresAt = Number(expiresAtString);

  if (!email || !Number.isFinite(expiresAt) || !signature) {
    return false;
  }

  if (Date.now() > expiresAt || email !== adminEmail) {
    return false;
  }

  const payload = `${email}|${expiresAt}`;

  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    const actual = Buffer.from(signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (actual.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
