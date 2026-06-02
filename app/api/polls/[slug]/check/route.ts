import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anonHash, getClientIp } from "@/lib/identity";
import { hasAlreadyVoted, normalizeDupMode } from "@/lib/dedup";

export const runtime = "nodejs";

// 페이지 진입 시 "이미 투표했는지" 서버 기준으로 재확인.
// (localStorage 가 지워져도 기기/IP 해시로 판별)
export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  let deviceId = "";
  try {
    deviceId = ((await req.json())?.deviceId ?? "").trim();
  } catch {
    /* 빈 본문 허용 */
  }

  const poll = await prisma.poll.findUnique({
    where: { slug },
    select: { id: true, dupMode: true, isClosed: true, closesAt: true },
  });
  if (!poll) return NextResponse.json({ error: "not found" }, { status: 404 });

  const closed =
    poll.isClosed || (poll.closesAt ? poll.closesAt.getTime() <= Date.now() : false);

  let voted = false;
  if (deviceId) {
    const mode = normalizeDupMode(poll.dupMode);
    voted = await hasAlreadyVoted(
      poll.id,
      mode,
      anonHash(deviceId),
      anonHash(getClientIp(req.headers)),
    );
  }

  return NextResponse.json({ voted, closed });
}
