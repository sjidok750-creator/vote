import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { buildResultImage, RESULT_OG_SIZE } from "@/lib/result-og";
import { loadKoreanFont } from "@/lib/og-font";

export const runtime = "nodejs";
export const alt = "투표 결과";
export const size = RESULT_OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const poll = await prisma.poll.findUnique({
    where: { slug },
    include: {
      options: {
        orderBy: { position: "asc" },
        select: { label: true, _count: { select: { votes: true } } },
      },
      _count: { select: { ballots: true } },
    },
  });

  // 공개되지 않았으면 결과 수치를 노출하지 않는 일반 이미지
  if (!poll || !poll.resultsShared) {
    const font = await loadKoreanFont("비밀투표 결과는 비공개입니다", 800);
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1b1140, #5b1f74)",
            color: "white",
            fontFamily: "Noto",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", fontSize: 80 }}>🔒</div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800 }}>비밀투표</div>
        </div>
      ),
      {
        ...size,
        fonts: font
          ? [{ name: "Noto", data: font, weight: 800 as const, style: "normal" as const }]
          : [],
      },
    );
  }

  return buildResultImage({
    title: poll.title,
    total: poll._count.ballots,
    options: poll.options.map((o) => ({ label: o.label, count: o._count.votes })),
  });
}
