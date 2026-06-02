import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ResultsChart from "@/app/_components/results-chart";
import ShareResultButtons from "./share-buttons";

export const dynamic = "force-dynamic";

async function getPoll(slug: string) {
  return prisma.poll.findUnique({
    where: { slug },
    include: {
      options: {
        orderBy: { position: "asc" },
        select: { id: true, label: true, _count: { select: { votes: true } } },
      },
      _count: { select: { ballots: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const poll = await getPoll(slug);
  if (!poll || !poll.resultsShared) return { title: "결과", robots: { index: false } };
  return {
    title: `${poll.title} · 결과`,
    description: `총 ${poll._count.ballots}명 참여한 투표 결과를 확인하세요.`,
    openGraph: {
      title: `📊 ${poll.title} · 결과`,
      description: `총 ${poll._count.ballots}명 참여`,
      url: `/result/${slug}`,
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const poll = await getPoll(slug);
  if (!poll) notFound();

  if (!poll.resultsShared) {
    return (
      <main className="grid min-h-dvh place-items-center px-5">
        <div className="card animate-pop w-full max-w-sm p-8 text-center">
          <div className="mb-3 text-5xl">🔒</div>
          <h1 className="text-xl font-extrabold">비공개 결과입니다</h1>
          <p className="mt-2 text-soft">관리자가 아직 결과를 공개하지 않았습니다.</p>
          <Link href="/" className="btn btn-primary mt-6 w-full">
            새 투표 만들기
          </Link>
        </div>
      </main>
    );
  }

  const total = poll._count.ballots;
  const options = poll.options.map((o) => ({
    id: o.id,
    label: o.label,
    count: o._count.votes,
  }));
  const closed =
    poll.isClosed || (poll.closesAt ? poll.closesAt.getTime() <= Date.now() : false);

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-10">
      <header className="mb-6 animate-pop text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/70 px-3 py-1 text-xs font-medium text-soft">
          📊 투표 결과 {closed ? "· 마감됨" : "· 진행 중"}
        </div>
        <h1 className="text-2xl font-extrabold leading-snug">{poll.title}</h1>
        {poll.description && (
          <p className="mt-1.5 whitespace-pre-wrap text-soft">{poll.description}</p>
        )}
      </header>

      <section className="card animate-pop p-6" style={{ animationDelay: "0.05s" }}>
        {total === 0 ? (
          <p className="py-8 text-center text-soft">아직 참여자가 없습니다.</p>
        ) : (
          <ResultsChart options={options} total={total} />
        )}
      </section>

      <ShareResultButtons slug={slug} title={poll.title} />

      <Link href="/" className="btn btn-ghost mx-auto mt-6 flex w-fit">
        🔒 나도 비밀투표 만들기
      </Link>
    </main>
  );
}
