import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveProfileSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const parsed = saveProfileSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const profile = parsed.data.profile;
  const studentName = profile.student.name;

  const saved = profile.id
    ? await prisma.profile.update({
        where: { id: profile.id },
        data: { studentName, data: profile },
      })
    : await prisma.profile.create({
        data: { studentName, data: profile },
      });

  return Response.json({ id: saved.id, profile: saved.data });
}
