import { prisma } from "./prisma";

export type DupMode = "none" | "device" | "ip" | "strict";

export function normalizeDupMode(value: unknown): DupMode {
  return value === "none" || value === "ip" || value === "strict"
    ? value
    : "device";
}

/**
 * 해당 기기/IP 가 이미 이 투표에 참여했는지 판별.
 * - none   : 중복 허용 (항상 false)
 * - device : 같은 기기면 차단
 * - ip     : 같은 IP면 차단
 * - strict : 같은 기기 또는 같은 IP면 차단
 */
export async function hasAlreadyVoted(
  pollId: string,
  mode: DupMode,
  deviceKey: string,
  ipKey: string,
): Promise<boolean> {
  if (mode === "none") return false;

  const or: { deviceKey?: string; ipKey?: string }[] = [];
  if (mode === "device" || mode === "strict") or.push({ deviceKey });
  if (mode === "ip" || mode === "strict") or.push({ ipKey });

  const existing = await prisma.ballot.findFirst({
    where: { pollId, OR: or },
    select: { id: true },
  });
  return !!existing;
}
