import { requireAuth } from "@/lib/auth";
import { ensureDatabase, prisma } from "@/lib/db";
import { exportGenerationFile } from "@/lib/export-file";
import { generateDocument, targetNameFromProfile } from "@/lib/generation";
import { generateSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const parsed = generateSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { profile, profileId } = parsed.data;
    const content = await generateDocument("ps", profile);
    const filePath = await exportGenerationFile({ type: "ps", profile, content });
    let generationId: string | undefined;

    if (profileId) {
      await ensureDatabase();
      const generation = await prisma.generation.create({
        data: {
          profileId,
          type: "ps",
          targetName: targetNameFromProfile(profile),
          input: profile,
          content,
        },
      });
      generationId = generation.id;
    }

    return Response.json({ content, generationId, filePath });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "生成失败" },
      { status: 500 },
    );
  }
}
