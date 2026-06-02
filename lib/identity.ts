import { createHash, randomBytes } from "crypto";

// 익명 해시용 솔트. 운영 시 환경변수로 덮어쓸 수 있습니다.
const SALT = process.env.VOTE_SALT ?? "votesecret-default-salt-change-me";

/** 원문을 그대로 저장하지 않기 위한 단방향 해시 (익명 보장) */
export function anonHash(value: string): string {
  return createHash("sha256").update(`${SALT}:${value}`).digest("hex");
}

/** 요청에서 클라이언트 IP 추출 (프록시 헤더 우선) */
export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "0.0.0.0"
  );
}

/** URL-safe 랜덤 토큰 */
export function randomToken(bytes = 24): string {
  return randomBytes(bytes)
    .toString("base64")
    .replace(/[+/=]/g, "")
    .slice(0, bytes);
}

/** 읽기 쉬운 짧은 slug (충돌 시 호출부에서 재시도) */
export function makeSlug(): string {
  return randomBytes(6).toString("hex"); // 12자
}
