import { logIn } from "@/app/lib/actions";

export default function Home() {
  return (
    <main className="container mx-auto max-w-screen-md py-10 px-4">
      <section>
        <h1 className="text-3xl font-bold mb-4 md:text-5xl">
          感情分析でチームのコミュニケーションを向上
        </h1>
        <p className="text-base-content text-lg md:text-2xl">
          Typetalk
          Sentimentは、Typetalkのメッセージを感情分析し、チームのコミュニケーションをより効果的にサポートするアプリケーションです。
        </p>
      </section>
      <div className="mt-10">
        <form action={logIn}>
          <button
            type="submit"
            className="btn btn-primary btn-lg w-full lg:w-auto"
          >
            Typetalkで始める
          </button>
        </form>
      </div>
    </main>
  );
}
