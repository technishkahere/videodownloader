import { errorJson, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAuthUser, UnauthorizedError } from "@/lib/auth";
import { removeFilesFor } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  let user;
  try {
    user = await requireAuthUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return errorJson("Sign in required", 401);
    throw e;
  }

  const row = await prisma.videoDownload.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!row || row.userId !== user.id) return errorJson("Not found", 404);

  await removeFilesFor([params.id]);
  await prisma.videoDownload.delete({ where: { id: params.id } });

  return json({ ok: true });
}
