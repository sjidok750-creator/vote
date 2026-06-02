"use client";

// 이 기기에서 만든 투표 목록을 localStorage 에 보관.
// 서버는 계정을 두지 않으므로, 관리자 링크(adminToken)를 잃어버려도
// 같은 기기·브라우저에서 다시 결과를 찾을 수 있게 하는 편의 기능입니다.

const KEY = "vs_my_polls";
const MAX = 100;

export type MyPoll = {
  slug: string;
  adminToken: string;
  title: string;
  createdAt: string; // ISO
};

export function getMyPolls(): MyPoll[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.filter(
      (p): p is MyPoll =>
        p && typeof p.slug === "string" && typeof p.adminToken === "string",
    );
  } catch {
    return [];
  }
}

export function saveMyPoll(poll: MyPoll) {
  if (typeof window === "undefined") return;
  try {
    // 같은 투표는 최신 정보로 갱신하고 맨 앞으로
    const list = getMyPolls().filter((p) => p.adminToken !== poll.adminToken);
    list.unshift(poll);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

export function removeMyPoll(adminToken: string) {
  if (typeof window === "undefined") return;
  try {
    const list = getMyPolls().filter((p) => p.adminToken !== adminToken);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
