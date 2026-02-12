import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "founder_session";

function getSecret(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return null;
  }
  return new TextEncoder().encode(secret);
}

function toUnauthorizedResponse(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/", request.url));
}

function toForbiddenResponse(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export async function middleware(request: NextRequest) {
  const secret = getSecret();
  if (!secret) {
    return toUnauthorizedResponse(request);
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return toUnauthorizedResponse(request);
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "ADMIN") {
      return toForbiddenResponse(request);
    }
    return NextResponse.next();
  } catch {
    return toUnauthorizedResponse(request);
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
