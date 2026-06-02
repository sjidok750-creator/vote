import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeDupMode } from "@/lib/dedup";

export const runtime = "nodejs";

async function loadByToken(token: string) {
  return prisma.poll.findUnique({ where: { adminToken: token } });
}

// 관리자 전용 결과 조회
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
        select: { id: true, label: true, _count: { select: { votes: true } } },
      },
      _count: { select: { ballots: true } },
    },
  });
  if (!poll) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({
    slug: poll.slug,
    title: poll.title,
    description: poll.description,
    allowMultiple: poll.allowMultiple,
    maxChoices: poll.maxChoices,
    dupMode: poll.dupMode,
    showResults: poll.showResults,
    resultsShared: poll.resultsShared,
    isClosed: poll.isClosed,
    closesAt: poll.closesAt,
    createdAt: poll.createdAt,
    totalBallots: poll._count.ballots,
    options: poll.options.map((o) => ({
      id: o.id,
      label: o.label,
      count: o._count.votes,
    })),
  });
}

// 설정 변경 / 마감 / 초기화
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const poll = await loadByToken(token);
  if (!poll) return NextResponse.json({ error: "not found" }, { status: 404 });

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }

  // 투표 초기화(표만 삭제, 설정 유지)
  if (body.action === "reset") {
    await prisma.ballot.deleteMany({ where: { pollId: poll.id } });
    return NextResponse.json({ ok: true, reset: true });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.isClosed === "boolean") data.isClosed = body.isClosed;
  if (typeof body.showResults === "boolean") data.showResults = body.showResults;
  if (typeof body.resultsShared === "boolean") data.resultsShared = body.resultsShared;
  if (typeof body.dupMode === "string") data.dupMode = normalizeDupMode(body.dupMode);

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "변경할 내용이 없습니다." }, { status: 400 });

  await prisma.poll.update({ where: { id: poll.id }, data });
  return NextResponse.json({ ok: true });
}

// 투표 삭제
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const poll = await loadByToken(token);
  if (!poll) return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.poll.delete({ where: { id: poll.id } });
  return NextResponse.json({ ok: true, deleted: true });
}
