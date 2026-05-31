import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "docgen_auth";

function getPassword() {
  return process.env.APP_PASSWORD || "change-me";
}

function signature() {
  return createHmac("sha256", getPassword())
    .update("study-abroad-docgen")
    .digest("hex");
}

export async function isAuthenticated() {
  const jar = await cookies();
  const value = jar.get(COOKIE_NAME)?.value;
  if (!value) return false;

  const expected = signature();
  const actualBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export async function requireAuth() {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function setAuthCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, signature(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function verifyPassword(password: string) {
  return password === getPassword();
}
