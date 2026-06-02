"use client";

// 브라우저별 영구 기기 ID (중복투표 방지의 1차 기준).
// localStorage 에 저장되며, 서버에서 IP/해시와 조합해 익명 판별합니다.

const KEY = "vs_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id =
      (crypto.randomUUID && crypto.randomUUID()) ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function markVoted(slug: string) {
  try {
    localStorage.setItem(`vs_voted_${slug}`, new Date().toISOString());
  } catch {
    /* ignore */
  }
}

export function hasVotedLocally(slug: string): boolean {
  try {
    return !!localStorage.getItem(`vs_voted_${slug}`);
  } catch {
    return false;
  }
}
