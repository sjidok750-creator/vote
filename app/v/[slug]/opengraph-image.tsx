import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { loadKoreanFont } from "@/lib/og-font";

export const runtime = "nodejs";
export const alt = "투표용지";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#bcd9ef";
const LINE = "#1f2d3d";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const poll = await prisma.poll.findUnique({
    where: { slug },
    include: { options: { orderBy: { position: "asc" }, select: { label: true } } },
  });

  const title = poll?.title ?? "투표";
  const allLabels = (poll?.options ?? []).map((o) => o.label);
  const shown = allLabels.slice(0, 6);
  const extra = allLabels.length - shown.length;

  const fontText =
    title + shown.join("") + "비밀투표 투표용지 관리단 외개 지금 투표하기 익명";
  const [regular, bold, extrabold] = await Promise.all([
    loadKoreanFont(fontText, 400),
    loadKoreanFont(fontText, 700),
    loadKoreanFont(fontText, 800),
  ]);

  const fonts = [
    regular && { name: "Noto", data: regular, weight: 400 as const, style: "normal" as const },
    bold && { name: "Noto", data: bold, weight: 700 as const, style: "normal" as const },
    extrabold && { name: "Noto", data: extrabold, weight: 800 as const, style: "normal" as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 400 | 700 | 800; style: "normal" }[];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: PAPER,
          padding: 56,
          fontFamily: "Noto",
          position: "relative",
        }}
      >
        {/* 투표용지 본체 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
          }}
        >
          {/* 상단 제목 줄 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `4px solid ${LINE}`,
              paddingBottom: 18,
              marginBottom: 26,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 22, color: "#2b4a63", fontWeight: 700 }}>
                비밀투표
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: title.length > 18 ? 40 : 52,
                  fontWeight: 800,
                  color: LINE,
                  maxWidth: 880,
                  lineHeight: 1.15,
                }}
              >
                {title}
              </div>
            </div>
            {/* 우상단 관인 도장 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 96,
                height: 96,
                border: "4px solid #c0392b",
                borderRadius: 14,
                color: "#c0392b",
                fontSize: 20,
                fontWeight: 700,
                transform: "rotate(-8deg)",
              }}
            >
              관인
            </div>
          </div>

          {/* 항목 박스들 (개수에 맞춰 높이 자동 분배) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              flex: 1,
              minHeight: 0,
            }}
          >
            {shown.map((label, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  border: `3px solid ${LINE}`,
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.35)",
                  flex: 1,
                  minHeight: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 70,
                    borderRight: `3px solid ${LINE}`,
                    fontSize: 32,
                    fontWeight: 800,
                    color: LINE,
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flex: 1,
                    paddingLeft: 36,
                    fontSize: 34,
                    fontWeight: 700,
                    color: LINE,
                    letterSpacing: 6,
                  }}
                >
                  {label}
                </div>
                {/* 기표란 */}
                <div style={{ display: "flex", width: 90, borderLeft: `3px solid ${LINE}` }} />
              </div>
            ))}
            {extra > 0 && (
              <div style={{ display: "flex", fontSize: 24, color: "#2b4a63", fontWeight: 700, paddingLeft: 6 }}>
                외 {extra}개 항목
              </div>
            )}
          </div>

          {/* 하단: 투표관리단 도장 + 안내 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                border: `2px solid ${LINE}`,
                borderRadius: 8,
                padding: "10px 16px",
              }}
            >
              <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: LINE }}>
                투표관리단
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: "3px solid #c0392b",
                  color: "#c0392b",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                확인
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: LINE,
                color: PAPER,
                fontSize: 26,
                fontWeight: 800,
                padding: "14px 28px",
                borderRadius: 999,
              }}
            >
              지금 투표하기 →
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
