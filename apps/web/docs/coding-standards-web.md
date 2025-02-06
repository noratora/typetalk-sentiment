# Typetalk Sentiment Web コーディング規約

本ドキュメントは、Typetalk Sentiment Webのコーディング規約を定義するものである。

## 目次

1. [ファイル構成](#ファイル構成)
2. [コード品質とフォーマット](#コード品質とフォーマット)
3. [コンポーネント設計](#コンポーネント設計)
4. [スタイリング](#スタイリング)
5. [状態管理](#状態管理)
6. [関連ドキュメント](#関連ドキュメント)

## ファイル構成

以下の命名規則に従ってファイルを配置すること

- コンポーネントファイル: `PascalCase`
- ページファイル: `page.tsx`
- ユーティリティ関数、カスタムフック: `camelCase`

## コード品質とフォーマット

本プロジェクトでは、以下の設定に従ってコードを記述すること。

- ESLint: Next.jsの推奨設定(next/core-web-vitals)を使用する
- Prettier: コードフォーマットの一貫性を維持する

コードスタイルの基本設定は[.editorconfig](../.editorconfig)で定義され、自動的に適用される。
その他の設定の詳細は[.eslintrc.json](../.eslintrc.json)を参照すること。

## コンポーネント設計

### サーバー/クライアントコンポーネントの使い分け

コンポーネントの役割に応じて適切な実行環境を選択する。サーバーコンポーネントはデータ取得と初期表示用のUIの構築に、クライアントコンポーネントはブラウザ上でのユーザーの操作を処理するために使用する。

1. サーバーコンポーネント
    - 使用ケース
      - 初期データの取得と表示
      - SEO要素を含むコンテンツ
      - JavaScriptバンドルサイズの最適化が必要な場合
    - 実装例

        ```typescript:src/app/spaces/[spaceKey]/topics/components/topic-list.tsx
        export default async function TopicList({
          accessToken,
          spaceKey,
        }: TopicListProps) {
          const response: GetTopicsResponse = await fetchTopics(accessToken, spaceKey);
          const topics: Topic[] = response.topics;

          return (
            <ul className="list-none space-y-4">
              {topics.map((topic) => (
                <li key={topic.id}>
                  <h2>{topic.name}</h2>
                  <Link href={`/spaces/${spaceKey}/topics/${topic.id}/messages`}>
                    メッセージ一覧を見る
                  </Link>
                </li>
              ))}
            </ul>
          );
        }
        ```

2. クライアントコンポーネント
    - 使用ケース
      - ブラウザ上でのユーザーの操作
      - ブラウザAPIの使用
      - Reactフックの使用
    - 実装例

        ```typescript:src/app/spaces/[spaceKey]/topics/[topicId]/messages/components/message-list-client-container.tsx
        "use client";

        export default function MessageListClientContainer({
          initialMessages,
        }: MessageListClientContainerProps) {
          const { posts, hasNext, loadMoreMessages, isLoading } =
            useMessages(initialMessages);

          return (
            <>
              <MessageListPresentation
                posts={posts}
                topicId={initialMessages.topic.id}
              />
              {hasNext && (
                <LoadMoreButton
                  loadMoreMessages={loadMoreMessages}
                  isLoading={isLoading}
                />
              )}
            </>
          );
        }
        ```

### コンポーネントの責務分離

データの取得、クライアントサイドの状態管理、表示ロジックを個別のコンポーネントに分割する。Container、Client Container、Presentationの3層構造により、各コンポーネントの役割を明確に定義する。

1. データ取得とロジック
    - Container
      - サーバーサイドのデータ取得

        ```typescript:src/app/spaces/[spaceKey]/topics/[topicId]/messages/components/message-list-container.    tsx
        export default async function MessageListContainer({
          accessToken,
          topicId,
        }: MessageListContainerProps) {
          const initialMessages: GetMessagesResponse = await fetchMessages(
            accessToken,
            topicId
          );

          return <MessageListClientContainer initialMessages={initialMessages} />;
        }
        ```

    - Client Container
      - クライアントサイドの状態管理
        - カスタムフックによるデータ管理
        - ローディング状態の管理
      - イベントハンドリング
        - ボタンクリックなどのユーザーの操作処理

      ```typescript:src/app/spaces/[spaceKey]/topics/[topicId]/messages/components/         message-list-client-container.tsx
      "use client";

      export default function MessageListClientContainer({
        initialMessages,
      }: MessageListClientContainerProps) {
        const { posts, hasNext, loadMoreMessages, isLoading } =
          useMessages(initialMessages);

        return (
          <>
            <MessageListPresentation
              posts={posts}
              topicId={initialMessages.topic.id}
            />
            {hasNext && (
              <LoadMoreButton
                loadMoreMessages={loadMoreMessages}
                isLoading={isLoading}
              />
            )}
          </>
        );
      }
      ```

2. 表示
    - Presentation
      - データを受け取って表示するのみ

      ```typescript:src/app/spaces/[spaceKey]/topics/[topicId]/messages/components/message-list-presentation.tsx
      export default function MessageListPresentation({
          posts,
          topicId,
      }: MessageListPresentationProps) {
          return (
          <>
              {posts.length === 0 ? (
              <p className="text-center text-neutral">メッセージがありません。</p>
              ) : (
              <ul className="list-none space-y-4">
                  {posts.map((post) => (
                  <li key={post.id}>
                      <MessageItem post={post} topicId={topicId} />
                  </li>
                  ))}
              </ul>
              )}
          </>
          );
      }
      ```

    - Skeleton
      - ローディング状態の表示

      ```typescript:src/app/spaces/[spaceKey]/topics/[topicId]/messages/components/message-list-skeleton.tsx
      export default function MessageListSkeleton() {
        return (
          <ul className="list-none space-y-4">
            {[...Array(3)].map((_, index) => (
              <li
                key={index}
                className="p-4 shadow-md bg-base-200 text-base-content rounded"
              >
                <div className="skeleton w-28 h-7"></div>
              </li>
            ))}
          </ul>
        );
      }
      ```

### エラー処理

エラーの検知から表示までを3層のコンポーネントで構成する。エラーバウンダリによる捕捉、ハンドラーによるログ記録と制御、アラートによるユーザー通知を実装する。

1. エラーバウンダリ
    - ページ単位でのエラーハンドリング

    ```typescript:src/app/error.tsx
    export default function Error({
      error,
      reset,
    }: {
      error: Error & { digest?: string };
      reset: () => void;
    }) {
      return (
        <div className="container mx-auto max-w-screen-md p-4">
          <ErrorHandler error={error} reset={reset} />
        </div>
      );
    }
    ```

2. エラーハンドラー
    - エラーのログ記録
    - リセット機能の提供

    ```typescript:src/app/components/error/error-handler.tsx
    export default function ErrorHandler({
      error,
      reset,
    }: {
      error: Error & { digest?: string };
      reset: () => void;
    }) {
      const reload = useReload(reset);

      useEffect(() => {
        console.error(error);
      }, [error]);

      return <ErrorAlert reset={reload} />;
    }
    ```

3. エラー表示
    - ユーザーへのエラー通知
    - リカバリーアクションの提供

    ```typescript:src/app/components/error/error-alert.tsx
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
    ```

## スタイリング

スタイリングには以下のツールを使用すること。

- daisyUI: UIコンポーネントライブラリ
- Tailwind CSS: ユーティリティファーストのCSSフレームワーク

## 状態管理

- 単純な状態管理には[`useState`](https://ja.react.dev/reference/react/useState)を使用すること
- 複雑な状態ロジックや関連する複数の状態を扱う場合は[`useReducer`](https://ja.react.dev/reference/react/useReducer)を使用すること。使い分けの基準は[こちら](https://ja.react.dev/learn/extracting-state-logic-into-a-reducer#comparing-usestate-and-usereducer)を参照すること
- グローバルな状態管理が必要な場合は、[React Context](https://ja.react.dev/learn/passing-data-deeply-with-context)を使用すること

## 関連ドキュメント

- [共通コーディング規約](../../../docs/coding-standards-root.md)
- [テスト戦略概要](../../../docs/testing-strategy.md)
- [エラーハンドリング](../../../docs/error-handling-root.md)
