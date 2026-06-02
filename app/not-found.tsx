import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="card animate-pop w-full max-w-sm p-8 text-center">
        <div className="mb-3 text-5xl">🗳️</div>
        <h1 className="text-xl font-extrabold">투표를 찾을 수 없어요</h1>
        <p className="mt-2 text-soft">링크가 만료되었거나 잘못된 주소일 수 있습니다.</p>
        <Link href="/" className="btn btn-primary mt-6 w-full">
          새 투표 만들기
        </Link>
      </div>
    </main>
  );
}
