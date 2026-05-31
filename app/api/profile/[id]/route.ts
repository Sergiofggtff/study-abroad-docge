import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const profile = await prisma.profile.findUnique({
    where: { id },
    include: {
      generations: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!profile) {
    return Response.json({ error: "未找到学生档案" }, { status: 404 });
  }

  return Response.json(profile);
}
