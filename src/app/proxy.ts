import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isValidAdminSession(token: string | undefined) {
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

  // Session has expired.
  if (Date.now() > expiresAt) {
    return false;
  }

  // Make sure the session belongs to the configured admin.
  if (email !== adminEmail) {
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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin login is publicly accessible.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Protect every other /admin route.
  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get("nexora-admin-session");

    if (!isValidAdminSession(session?.value)) {
      const loginUrl = new URL("/admin/login", request.url);

      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};