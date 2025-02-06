# Typetalk Sentiment Web テスト方針

## 目次

1. [概要](#概要)
2. [基本方針](#基本方針)
3. [テストツール](#テストツール)
4. [自動テストの種類](#自動テストの種類)
5. [モックの方針](#モックの方針)
6. [バックエンド連携](#バックエンド連携)
7. [ディレクトリ構造](#ディレクトリ構造)
8. [テストコードの記述規則](#テストコードの記述規則)
9. [テストの実行方法](#テストの実行方法)
10. [関連ドキュメント](#関連ドキュメント)

## 概要

本ドキュメントは、Typetalk Sentiment Webのテスト実装方針を定義するものである。[テスト戦略概要](../../../docs/testing-strategy.md)で定義された方針に基づき、Typetalk Sentiment Web固有のテスト実装方法について説明する。

## 基本方針

Typetalk Sentiment Webでは、以下の対象に対して自動テストを実装するものとする:

1. ユーティリティ関数
2. エラーハンドリング
3. カスタムフック
4. Next.jsのルートハンドラー

※ UIコンポーネントとユーザーフローについては、[テスト戦略概要](../../../docs/testing-strategy.md#手動e2eテスト)に従って手動E2Eテストで確認する。

## テストツール

- Vitest: 自動テストのテストフレームワークとして使用
- React Testing Library: カスタムフックのテストに使用

## 自動テストの種類

1. ユニットテスト
   - 入出力の検証とエラーケースの確認
   - バックエンドAPIはモック化して分離

## モックの方針

1. サブシステム固有のモック
   - テスト専用モック
     - 実装方法: `vi.mock()`を使用してテストファイル内でモック化
     - 用途: 自動テストでのみ使用

## バックエンド連携

1. Typetalk Sentiment API
   - インテグレーションテスト: 実施しない
     - 理由: 実際のバックエンドとの通信は手動E2Eテストでカバーされるため
   - ユニットテスト: テスト専用モックを使用

## ディレクトリ構造

テストコードは、テスト対象のファイルと同じディレクトリに配置する。ファイル名は `*.test.ts` とする。

例:

```sh:src/
src/
├── app/
│   ├── api/                     # ルートハンドラー
│   │   └── topics/[topicId]/messages/
│   │       ├── route.ts
│   │       └── route.test.ts    # ルートハンドラーのテスト
│   └── lib/                     # ユーティリティ関数
│       ├── data.ts
│       ├── data.test.ts         # データ操作のテスト
│       ├── date-utils.ts
│       └── date-utils.test.ts   # 日付操作のテスト
```

## テストコードの記述規則

### テストの構造化

1. テストクラスはテスト対象のファイルごとに作成する
2. `describe`ブロックでテストケースをグループ化する:
   - テスト対象を示すブロック
   - 正常系・異常系の区分
   - 仕様レベルの説明
   - テストケース

例:

```typescript:src/app/api/topics/[topicId]/messages/route.test.ts
// メッセージ一覧取得API
describe("GET /api/topics/[topicId]/messages", () => {                                                // テスト対象を示すブロック
  // 正常系
  describe("happy cases", () => {                                                                     // 正常系・異常系の区分
    // メッセージ一覧取得APIを呼び出した場合、指定したトピックのメッセージ一覧が取得される
    describe("When calling message list API then returns messages for the specified topic", () => {   // 仕様レベルの説明
      // メッセージ一覧取得APIを呼び出した場合、fetchMessagesの戻り値がレスポンスとして返される
      it("when calling message list API then returns fetchMessages result as response", async () => { // テストケース
        // テスト実装
      });
    });
  });
});
```

### テストデータ管理

1. 検証対象のデータはテストケース内で定義する

    例:

    ```typescript:src/app/api/topics/[topicId]/messages/route.test.ts
    // メッセージ一覧取得APIを呼び出した場合、fetchMessagesの戻り値がレスポンスとして返され
    it("when calling message list API then returns fetchMessages result as response", async () => {
      // Arrange
      const testResponse = {                                    // テストケース内で検証対象のデータを定義
        topic: { id: 123, name: "テストトピック" },
        hasNext: false,
        posts: [
          {
            id: 1,
            message: "テストメッセージ",
            updatedAt: new Date().toISOString(),
            account: {
              id: 1,
              name: "テストユーザー",
              imageUrl: "http://example.com/image.jpg",
            },
          },
        ],
      };
    ```

2. 検証に直接関係しないセットアップ用のデータは、describe内で定義する

    例:

    ```typescript:src/app/api/topics/[topicId]/messages/route.test.ts
    // メッセージ一覧取得API
    describe("GET /api/topics/[topicId]/messages", () => {
      beforeEach(() => {
        vi.resetAllMocks();
      });

      // 検証に使用しない共通のモックデータ
      const mockAccessToken = "mock-token";                     // describe内で共通のセットアップ用データを定義
      const mockTopicId = "123";

      // 正常系
      describe("happy cases", () => {
    ```

### 命名規則

1. テストファイル名: `*.test.ts` 形式を使用する

2. テストケース名: `it('when <条件> then <期待される結果>', ...)`の形式で英語で記述する

3. パラメータ化テストでは:
   - テストケース名は`when-then`形式で英語で記述する
   - 各パラメータの上に日本語コメントで説明を付記する
   - テストケースをグループ化する`describe`で、テストパターンの種類を説明する

    例:

    ```typescript:src/app/lib/url-utils.test.ts
    // 単純なキーと値のペア
    describe("simple key-value pairs", () => {                    // テストパターンの種類を説明するグループ
      // キーと値のペアのパラメータを指定すると、URLクエリ文字列の標準形式に従って変換されたURLが返される
      it.each([
        [
          // 文字列パラメータ                                      // 日本語の説明コメント
          "string parameter",
          { key: "value" },
          "/api/test?key=value",
        ],
        [
          // 数値パラメータ
          "number parameter",
          { key: 123 },
          "/api/test?key=123",
        ],
        [
          // 複数パラメータ
          "multiple parameters",
          { key1: "value1", key2: 123 },
          "/api/test?key1=value1&key2=123",
        ],
      ])(
        "when %s is provided then returns URL with query string",  // when-then形式の英語のテストケース名
        (_, params, expected) => {
          // テスト実装
        }
      );
    });
    ```

### ドキュメント化

各`describe`ブロックと`it`の前に、日本語で意図を説明するコメントを記述する。

例:

```typescript:src/app/api/topics/[topicId]/messages/route.test.ts
// メッセージ一覧取得API
describe("GET /api/topics/[topicId]/messages", () => {
  // 正常系
  describe("happy cases", () => {
    // メッセージ一覧取得APIを呼び出した場合、指定したトピックのメッセージ一覧が取得される
    describe("When calling message list API then returns messages for the specified topic", () => {
      // メッセージ一覧取得APIを呼び出した場合、fetchMessagesの戻り値がレスポンスとして返される
      it("when calling message list API then returns fetchMessages result as response", async () => {
        // テスト実装
      });
    });
  });
});
```

## テストの実行方法

```sh
# 全てのテストを実行
npm run test

# 特定のテストファイルを実行
npm run test -- path/to/test-file.test.ts

# カバレッジレポートを生成する (生成されたHTMLレポートは `coverage/index.html` で確認できる)
npm run test -- --coverage
```

## 関連ドキュメント

- [テスト戦略概要](../../../docs/testing-strategy.md)
- [Typetalk Sentiment API テスト方針](../../api/docs/testing-api.md)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)
- [Setting up Vitest with Next.js](https://nextjs.org/docs/app/building-your-application/testing/vitest)
- [Vitest公式ドキュメント](https://vitest.dev/)
- [React Testing Library公式ドキュメント](https://testing-library.com/)
