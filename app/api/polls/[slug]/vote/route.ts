import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anonHash, getClientIp } from "@/lib/identity";
import { hasAlreadyVoted, normalizeDupMode } from "@/lib/dedup";

export const runtime = "nodejs";

type Body = { deviceId?: string; optionIds?: string[] };

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const deviceId = (body.deviceId ?? "").trim();
  const optionIds = Array.from(new Set(body.optionIds ?? []));

  if (!deviceId)
    return NextResponse.json({ error: "기기 정보를 확인할 수 없습니다." }, { status: 400 });
  if (optionIds.length < 1)
    return NextResponse.json({ error: "항목을 선택해 주세요." }, { status: 400 });

  const poll = await prisma.poll.findUnique({
    where: { slug },
    include: { options: { select: { id: true } } },
  });
  if (!poll)
    return NextResponse.json({ error: "존재하지 않는 투표입니다." }, { status: 404 });

  // 마감 여부
  const closedByTime = poll.closesAt && poll.closesAt.getTime() <= Date.now();
  if (poll.isClosed || closedByTime)
    return NextResponse.json({ error: "마감된 투표입니다.", code: "closed" }, { status: 403 });

  // 선택 개수 규칙
  if (!poll.allowMultiple && optionIds.length !== 1)
    return NextResponse.json({ error: "한 개만 선택할 수 있습니다." }, { status: 400 });
  if (poll.allowMultiple && poll.maxChoices && optionIds.length > poll.maxChoices)
    return NextResponse.json(
      { error: `최대 ${poll.maxChoices}개까지 선택할 수 있습니다.` },
      { status: 400 },
    );

  // 항목 유효성
  const validIds = new Set(poll.options.map((o) => o.id));
  if (!optionIds.every((id) => validIds.has(id)))
    return NextResponse.json({ error: "잘못된 항목입니다." }, { status: 400 });

  const mode = normalizeDupMode(poll.dupMode);
  const deviceKey = anonHash(deviceId);
  const ipKey = anonHash(getClientIp(req.headers));

  if (await hasAlreadyVoted(poll.id, mode, deviceKey, ipKey))
    return NextResponse.json(
      { error: "이미 참여하신 투표입니다.", code: "already" },
      { status: 409 },
    );

  // 투표 기록(익명) — 누가 무엇을 골랐는지 식별 불가
  try {
    await prisma.ballot.create({
      data: {
        pollId: poll.id,
        deviceKey,
        ipKey,
        votes: { create: optionIds.map((optionId) => ({ optionId })) },
      },
    });
  } catch {
    return NextResponse.json({ error: "투표 처리 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
