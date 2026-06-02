import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// 투표자용 결과 — 관리자가 "결과 공개"를 켠 경우에만 반환.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  const poll = await prisma.poll.findUnique({
    where: { slug },
    include: {
      options: {
        orderBy: { position: "asc" },
        select: { id: true, label: true, _count: { select: { votes: true } } },
      },
      _count: { select: { ballots: true } },
    },
  });
  if (!poll) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!poll.showResults)
    return NextResponse.json({ error: "비공개 결과입니다." }, { status: 403 });

  return NextResponse.json({
    title: poll.title,
    totalBallots: poll._count.ballots,
    options: poll.options.map((o) => ({
      id: o.id,
      label: o.label,
      count: o._count.votes,
    })),
  });
}
