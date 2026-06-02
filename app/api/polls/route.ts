import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { makeSlug, randomToken } from "@/lib/identity";
import { normalizeDupMode } from "@/lib/dedup";

export const runtime = "nodejs";

type Body = {
  title?: string;
  description?: string;
  options?: string[];
  allowMultiple?: boolean;
  maxChoices?: number | null;
  dupMode?: string;
  showResults?: boolean;
  closesAt?: string | null;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const options = (body.options ?? [])
    .map((o) => (o ?? "").trim())
    .filter(Boolean);

  if (title.length < 1)
    return NextResponse.json({ error: "투표 제목을 입력해 주세요." }, { status: 400 });
  if (title.length > 120)
    return NextResponse.json({ error: "제목이 너무 깁니다." }, { status: 400 });
  if (options.length < 2)
    return NextResponse.json(
      { error: "항목을 2개 이상 입력해 주세요." },
      { status: 400 },
    );
  if (options.length > 30)
    return NextResponse.json({ error: "항목이 너무 많습니다." }, { status: 400 });

  const allowMultiple = !!body.allowMultiple;
  let maxChoices: number | null = null;
  if (allowMultiple && body.maxChoices != null) {
    const m = Math.floor(Number(body.maxChoices));
    if (Number.isFinite(m) && m >= 1 && m <= options.length) maxChoices = m;
  }

  let closesAt: Date | null = null;
  if (body.closesAt) {
    const d = new Date(body.closesAt);
    if (!isNaN(d.getTime()) && d.getTime() > Date.now()) closesAt = d;
  }

  // slug 충돌 방지(최대 5회 재시도)
  let slug = makeSlug();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.poll.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) break;
    slug = makeSlug();
  }

  const adminToken = randomToken(28);

  const poll = await prisma.poll.create({
    data: {
      slug,
      adminToken,
      title,
      description: (body.description ?? "").trim() || null,
      allowMultiple,
      maxChoices,
      dupMode: normalizeDupMode(body.dupMode),
      showResults: !!body.showResults,
      closesAt,
      options: {
        create: options.map((label, i) => ({ label, position: i })),
      },
    },
    select: { slug: true, adminToken: true },
  });

  return NextResponse.json(poll, { status: 201 });
}
