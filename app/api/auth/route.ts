import { isAuthenticated, setAuthCookie, verifyPassword } from "@/lib/auth";

export async function GET() {
  return Response.json({ authenticated: await isAuthenticated() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { password?: string };

  if (!verifyPassword(body.password || "")) {
    return Response.json({ error: "访问密码不正确" }, { status: 401 });
  }

  await setAuthCookie();
  return Response.json({ ok: true });
}
