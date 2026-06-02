import { ImageResponse } from "next/og";
import { loadKoreanFont } from "./og-font";

const PALETTE = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e"];

export const RESULT_OG_SIZE = { width: 1200, height: 630 };

type Data = {
  title: string;
  total: number;
  options: { label: string; count: number }[];
};

// 공유용 결과 그래픽(막대 차트) — KakaoTalk 미리보기 / 이미지 저장 공용
export async function buildResultImage(data: Data): Promise<ImageResponse> {
  const ranked = data.options
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const max = Math.max(1, ...ranked.map((o) => o.count));

  const fontText =
    data.title +
    ranked.map((o) => o.label).join("") +
    "투표 결과 비밀투표 명 참여 지금 만들기 표 위 VoteSecret";
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
          flexDirection: "column",
          background: "linear-gradient(135deg, #1b1140 0%, #3b1d6e 55%, #5b1f74 100%)",
          padding: 56,
          fontFamily: "Noto",
          color: "white",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: "#c4b5fd" }}>
              투표 결과
            </div>
            <div
              style={{
                display: "flex",
                fontSize: data.title.length > 18 ? 42 : 54,
                fontWeight: 800,
                maxWidth: 820,
                lineHeight: 1.1,
              }}
            >
              {data.title}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.12)",
              borderRadius: 24,
              padding: "16px 26px",
            }}
          >
            <div style={{ display: "flex", fontSize: 48, fontWeight: 800 }}>{data.total}</div>
            <div style={{ display: "flex", fontSize: 20, color: "#ddd6fe" }}>명 참여</div>
          </div>
        </div>

        {/* 막대들 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, minHeight: 0 }}>
          {ranked.map((o, i) => {
            const pct = data.total ? Math.round((o.count / data.total) * 100) : 0;
            const w = (o.count / max) * 100;
            return (
              <div
                key={i}
                style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, justifyContent: "center" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", fontSize: 26, fontWeight: 700 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        marginRight: 12,
                        background: PALETTE[i % PALETTE.length],
                        fontSize: 20,
                        fontWeight: 800,
                      }}
                    >
                      {i + 1}
                    </div>
                    {o.label}
                    {i === 0 ? "  · 1위" : ""}
                  </div>
                  <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#e9d5ff" }}>
                    {o.count}표 · {pct}%
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    height: 22,
                    background: "rgba(255,255,255,0.12)",
                    borderRadius: 999,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: `${Math.max(w, 2)}%`,
                      background: PALETTE[i % PALETTE.length],
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 푸터 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 22,
            color: "#c4b5fd",
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          <div style={{ display: "flex" }}>비밀투표 · VoteSecret</div>
          <div style={{ display: "flex" }}>나도 투표 만들기 →</div>
        </div>
      </div>
    ),
    { ...RESULT_OG_SIZE, fonts },
  );
}
