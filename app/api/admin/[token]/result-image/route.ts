import { prisma } from "@/lib/prisma";
import { buildResultImage } from "@/lib/result-og";

export const runtime = "nodejs";

// 관리자 전용 결과 이미지(PNG) — 저장/공유용. 토큰을 알아야만 접근 가능.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const poll = await prisma.poll.findUnique({
    where: { adminToken: token },
    include: {
      options: {
        orderBy: { position: "asc" },
        select: { label: true, _count: { select: { votes: true } } },
      },
      _count: { select: { ballots: true } },
    },
  });
  if (!poll) return new Response("not found", { status: 404 });

  return buildResultImage({
    title: poll.title,
    total: poll._count.ballots,
    options: poll.options.map((o) => ({ label: o.label, count: o._count.votes })),
  });
}
