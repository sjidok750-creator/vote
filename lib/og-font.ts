// OG 이미지에 한글을 렌더링하기 위한 폰트 로더.
// 필요한 글자(text)만 포함된 서브셋을 Google Fonts 에서 받아옵니다(satori 는 woff2 미지원 → truetype 사용).

const cache = new Map<string, ArrayBuffer>();

export async function loadKoreanFont(
  text: string,
  weight: 400 | 700 | 800 = 400,
): Promise<ArrayBuffer | null> {
  // 항상 들어가는 기본 글자 + 요청 글자
  const chars = Array.from(new Set(("0123456789%·외개표" + text).split(""))).join("");
  const key = `${weight}:${chars}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}&text=${encodeURIComponent(
      chars,
    )}`;
    const css = await (await fetch(url)).text();
    const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!match) return null;
    const res = await fetch(match[1]);
    if (res.status !== 200) return null;
    const buf = await res.arrayBuffer();
    cache.set(key, buf);
    return buf;
  } catch {
    return null;
  }
}
