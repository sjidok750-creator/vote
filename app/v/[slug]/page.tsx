import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import VoteClient from "./vote-client";

export const dynamic = "force-dynamic";

async function getPoll(slug: string) {
  return prisma.poll.findUnique({
    where: { slug },
    include: { options: { orderBy: { position: "asc" }, select: { id: true, label: true } } },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const poll = await getPoll(slug);
  const title = poll ? poll.title : "투표";
  const description = poll?.description?.trim()
    ? poll.description
    : "지금 참여하세요 · 익명 투표 · 결과는 관리자만 확인합니다";
  return {
    title,
    description,
    openGraph: {
      title: `🗳️ ${title}`,
      description,
      type: "website",
      url: `/v/${slug}`,
    },
    twitter: { card: "summary_large_image", title: `🗳️ ${title}`, description },
  };
}

export default async function VotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const poll = await getPoll(slug);
  if (!poll) notFound();

  const closed =
    poll.isClosed || (poll.closesAt ? poll.closesAt.getTime() <= Date.now() : false);

  return (
    <VoteClient
      slug={poll.slug}
      title={poll.title}
      description={poll.description}
      options={poll.options}
      allowMultiple={poll.allowMultiple}
      maxChoices={poll.maxChoices}
      showResults={poll.showResults}
      closed={closed}
    />
  );
}
