# Typetalk Sentiment API テスト方針

## 目次

1. [概要](#概要)
2. [基本方針](#基本方針)
3. [テストツール](#テストツール)
4. [自動テストの種類](#自動テストの種類)
5. [モックの方針](#モックの方針)
6. [外部サービス連携](#外部サービス連携)
7. [ディレクトリ構造](#ディレクトリ構造)
8. [テストコードの記述規則](#テストコードの記述規則)
9. [テストの実行方法](#テストの実行方法)
10. [関連ドキュメント](#関連ドキュメント)

## 概要

本ドキュメントは、Typetalk Sentiment APIのテスト実装方針を定義するものである。[テスト戦略概要](../../../docs/testing-strategy.md)で定義された方針に基づき、Typetalk Sentiment API固有のテスト実装方法について説明する。

## 基本方針

Typetalk Sentiment APIでは、以下の対象に対して自動テストを実装するものとする:

1. 全ての公開APIエンドポイント
2. ビジネスロジック
3. 外部サービス連携
   - Typetalk API
   - Amazon Comprehend
4. エラーハンドリングとエッジケース

## テストツール

- pytest: ユニットテストとインテグレーションテストのフレームワークとして使用
- FastAPI TestClient: APIエンドポイントのテストに使用

## 自動テストの種類

1. ユニットテスト
   - ロジックのテスト (APIエンドポイント、ビジネスロジック、外部サービス連携)
   - 外部サービスはモック化して分離
   - 入出力の検証とエラーケースの確認

2. インテグレーションテスト
   - 実際の外部サービスと連携した自動テスト

## モックの方針

1. サブシステム固有のモック
   - テスト専用モック
     - 配置場所: `tests/unit/mocks/`
     - 実装方法: モッククラスを作成して依存を置き換え
     - 用途: 自動テストでのみ使用

   - 開発用モック
     - 配置場所: `src/infrastructure/`
     - 実装方法: プロダクションコードと同じインターフェースを実装したモッククラスを作成
     - 用途: 自動テストと手動E2Eテストで使用

2. Typetalk APIモックサーバー
   - 用途: 自動テストと手動E2Eテストで使用
   - 詳細は[テスト戦略概要](../../../docs/testing-strategy.md#モック戦略)を参照

## 外部サービス連携

1. AWS Comprehend
   - インテグレーションテスト: 実際のAWS Comprehend APIと通信
     - 注意点:
       - 有効なAWS認証情報が必要 (`.env`ファイルで管理)
       - テスト実行時にAWS利用料金が発生する可能性あり
   - ユニットテスト: テスト専用モックと開発用モックを使用

2. Typetalk API
   - インテグレーションテスト: 実施しない
     - 理由: 実際に投稿されたデータに依存するため、テストの再現性と安定性を確保できない
   - ユニットテスト: テスト専用モックとモックサーバーを使用

## ディレクトリ構造

テストコードは、以下のディレクトリ構造で管理する:

```sh
tests/
├── unit/                 # ユニットテスト
│   ├── api/              # APIエンドポイントのテスト
│   ├── use_cases/        # ビジネスロジックのテスト
│   ├── infrastructure/   # インフラストラクチャ層のテスト
│   └── mocks/            # テスト専用モック
│       ├── aws/          # AWS関連モック
│       └── typetalk/     # Typetalk関連モック
└── integration/          # インテグレーションテスト
    └── aws/              # AWS Comprehendテスト
```

## テストコードの記述規則

### テストの構造化

1. テストクラスはテスト対象のクラスまたはモジュールごとに作成する
2. 内部クラスを使用してテストケースを論理的にグループ化する:
   - テスト対象のクラスを示すクラス
   - テスト対象のメソッドを示すクラス
   - テストシナリオ (正常系・異常系) を示すクラス
   など、テストの要件に応じて適切な階層構造を選択する

例:

```python:tests/unit/infrastructure/typetalk/test_typetalk_api.py
class TestTypetalkApi:                   # テスト対象のクラスを示すクラス
    class TestGetSpaces:                 # テスト対象のメソッドを示すクラス
        class TestHappyCases:            # テストシナリオ (正常系) を示すクラス
            def test_when_valid_token_provided_then_returns_expected_spaces(self):
                ...
        class TestUnhappyCases:          # テストシナリオ (異常系) を示すクラス
            def test_when_invalid_token_provided_then_raises_unauthorized_error(self):
                ...
```

### テストデータ管理

1. 検証対象のデータはテストメソッド内で定義する

    例:

    ```python:tests/unit/infrastructure/typetalk/test_typetalk_api.py
    def test_when_valid_token_provided_then_returns_expected_spaces(
        self,
        typetalk_api: ITypetalkApi,
    ) -> None:
        typetalk_token = "valid_typetalk_token" # テストメソッド内で検証対象のデータを定義
        expected = TypetalkGetSpacesResponse(
            my_spaces=[
                MySpace(
                    space=Space(
                        key="abcdefghij",
                        name="テスト組織1",
                        image_url="https://placehold.jp/150x150.png",
                    ),
                ),
            ],
        )
    ```

2. 検証に直接関係しないセットアップ用のデータは、クラス変数やフィクスチャとして定義する

    例:

    ```python:tests/unit/infrastructure/aws/comprehend/test_aws_comprehend_api.py
    class TestAwsComprehendApi:
        """AwsComprehendApiクラスのテストケース"""

        class TestBatchDetectSentiment:
            """batch_detect_sentimentメソッドのテストケース"""

            @pytest.fixture
            def mock_comprehend_client(self, mocker: MockerFixture) -> Mock:
                """AWS Comprehendクライアントのモックを提供する"""
                mock_client = mocker.Mock()
                mocker.patch("boto3.client", return_value=mock_client)
                return mock_client
    ```

### 命名規則

1. テストファイル名: `test_` で始める (例: `test_aws_comprehend_api.py`)

2. テストクラス名: `Test` で始める

3. テストメソッド名: `test_when_<条件>_then_<期待される結果>`の形式で英語で記述する

4. パラメータ化テストでは、`ids` を使用してテストパターンに意図が明確な名前を英語で記述し、日本語のコメントを付けて意図を説明する

    例:

    ```python:tests/unit/infrastructure/aws/comprehend/test_aws_comprehend_api.py
    @pytest.mark.parametrize(
        "text_list",
        [
            (["a"]),
            (["a" *AwsComprehendApi.MAX_TEXT_SIZE]),
            (["テストテキスト"]),
            (["テスト"]* AwsComprehendApi.MAX_BATCH_SIZE),
        ],
        ids=[
            # 1文字のテキストを処理できること
            "when_minimum_length_text_provided_then_processes_successfully",
            # 最大許容サイズのテキストを処理できること
            "when_maximum_length_text_provided_then_processes_successfully",
            # 1つのテキストのみを含むリストを処理できること
            "when_minimum_batch_size_provided_then_processes_successfully",
            # 最大バッチサイズまでのテキストを処理できること
            "when_maximum_batch_size_provided_then_processes_successfully",
        ],
    )
    def test_when_edge_case_inputs_provided_then_returns_expected_sentiments(
    ```

### ドキュメント化

1. コメントは日本語で記述する
2. モジュールレベルのdocstring
   - ファイルの目的や内容を簡潔に説明する
   - 「〜を定義する」という形式で終わる
   - 1行で記述する
3. テストメソッドのdocstring
   - 1行目に「期待するふるまい」を日本語で明示する
   - 自然な日本語表現を使用し、テストの結果や状態を明確に示す
   - 必要に応じてテストケースの補足説明や前提条件を記述する

例:

```python:tests/unit/infrastructure/typetalk/test_typetalk_api.py
"""Typetalk APIのテストケースを定義する""" # モジュールレベルのdocstring

class TestTypetalkApi:
    """Typetalk APIのテストケース"""
    class TestGetSpaces:
        """get_spacesメソッドのテストケース"""
        class TestHappyCases:
            """正常系のテストケース"""
            def test_when_valid_token_provided_then_returns_expected_spaces(
                self,
                typetalk_api: ITypetalkApi,
            ) -> None:
                """有効なトークンが提供された場合に期待される組織一覧が返される""" # テストメソッドのdocstring
```

## テストの実行方法

```sh
# 全てのユニットテストを実行 (デフォルトでインテグレーションテストは除外)
pytest

# インテグレーションテストのみを実行
# 注意:
# - 有効なAWS認証情報 (.env.awsファイル) が必要
# - AWS Comprehend APIの使用により課金が発生する可能性あり
pytest -m integration

# 特定のテストファイルを実行
pytest path/to/test-file.py

# カバレッジレポートを生成 (生成されたHTMLレポートは `htmlcov/index.html` で確認できる)
pytest --cov=src --cov-report=html
```

## 関連ドキュメント

- [テスト戦略概要](../../../docs/testing-strategy.md)
- [Typetalk Sentiment Web テスト方針](../../web/docs/testing-web.md)
- [pytest公式ドキュメント](https://docs.pytest.org/en/stable/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
