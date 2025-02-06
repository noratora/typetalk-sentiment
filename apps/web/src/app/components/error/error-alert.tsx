"use client";

export default function ErrorAlert({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center" role="alert">
      <h2 className="text-2xl font-bold mb-4">エラーが発生しました！</h2>
      <p className="mb-2">数分後にもう一度お試しください。</p>
      <p className="mb-4">
        再試行しても問題が解決しない場合は、開発者にお問い合わせください。
      </p>
      <button
        className="btn btn-primary w-full lg:w-auto"
        onClick={() => reset()}
      >
        再試行する
      </button>
    </div>
  );
}
