import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { exportGenerationFile } from "@/lib/export-file";
import { applicationProfileSchema } from "@/lib/schemas";
import { z } from "zod";

const saveGenerationSchema = z.object({
  profileId: z.string().min(1),
  type: z.enum(["ps", "cv"]),
  targetName: z.string().optional(),
  input: applicationProfileSchema,
  content: z.string().min(1),
});

export async function POST(request: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const parsed = saveGenerationSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const generation = await prisma.generation.create({
    data: {
      profileId: parsed.data.profileId,
      type: parsed.data.type,
      targetName: parsed.data.targetName || "未命名项目",
      input: parsed.data.input,
      content: parsed.data.content,
    },
  });
  const filePath = await exportGenerationFile({
    type: parsed.data.type,
    profile: parsed.data.input,
    content: parsed.data.content,
  });

  return Response.json({ id: generation.id, filePath });
}
