"""メッセージ一覧取得APIのテストケースを定義する"""

from collections.abc import Generator

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app, raise_server_exceptions=False)


class TestGetMessagesApi:
    """メッセージ一覧取得APIのテストクラス"""

    class TestHappyCases:
        """正常系のテストケース"""

        @pytest.mark.parametrize(
            ("typetalk_token", "topic_id", "expected"),
            [
                (
                    "valid_typetalk_token",
                    6310,
                    {
                        "topic": {
                            "id": 6310,
                            "name": "テストトピック1",
                            "description": "テストトピックの説明",
                        },
                        "hasNext": True,
                        "posts": [
                            {
                                "id": 154011,
                                "message": (
                                    "テストメッセージ1 abcdefg "
                                    "あいうえおかきくけこさしすせそたちつてとなにぬねの"
                                ),
                                "updatedAt": "2024-09-12T12:34:56Z",
                                "account": {
                                    "id": 2489,
                                    "name": "test-user-01",
                                    "imageUrl": "https://placehold.jp/150x150.png",
                                },
                                "sentiment": "POSITIVE",
                            },
                            {
                                "id": 154010,
                                "message": "テストメッセージ2 abcdefg https://example.com/",
                                "updatedAt": "2024-09-11T12:34:56Z",
                                "account": {
                                    "id": 2492,
                                    "name": "test-user-02",
                                    "imageUrl": "https://placehold.jp/150x150.png",
                                },
                                "sentiment": "POSITIVE",
                            },
                        ],
                    },
                ),
                (
                    "valid_typetalk_token",
                    390668,
                    {
                        "topic": {
                            "id": 390668,
                            "name": "分析対象メッセージ0件のトピック",
                            "description": "",
                        },
                        "hasNext": False,
                        "posts": [
                            {
                                "id": 126996578,
                                "message": "",
                                "updatedAt": "2024-02-17T15:32:09Z",
                                "account": {
                                    "id": 2492,
                                    "name": "test-user-02",
                                    "imageUrl": "https://placehold.jp/150x150.png",
                                },
                                "sentiment": None,
                            },
                            {
                                "id": 126996574,
                                "message": "",
                                "updatedAt": "2024-02-17T15:31:53Z",
                                "account": {
                                    "id": 2492,
                                    "name": "test-user-02",
                                    "imageUrl": "https://placehold.jp/150x150.png",
                                },
                                "sentiment": None,
                            },
                        ],
                    },
                ),
            ],
            ids=[
                # 有効なトークンとトピックIDの場合、最新のメッセージが返される
                "when_valid_token_and_topic_id_provided_then_returns_latest_messages",
                # メッセージが空のトピックの場合、感情分析なしで返される
                "when_topic_has_empty_messages_then_returns_without_sentiment",
            ],
        )
        def test_when_valid_token_and_topic_id_provided_then_returns_expected_messages(
            self,
            typetalk_token: str,
            topic_id: int,
            expected: dict,
        ) -> None:
            """有効なトークンとトピックIDが提供された場合に期待されるメッセージ一覧が返される"""
            # Act
            response = client.get(
                f"/topics/{topic_id}/messages",
                headers={"x-typetalk-token": typetalk_token},
            )

            # Assert
            assert response.status_code == status.HTTP_200_OK
            content = response.json()
            assert content == expected

        def test_when_valid_from_id_provided_then_returns_expected_messages(
            self,
        ) -> None:
            """有効なトークン、トピックID、および開始IDが提供された場合に期待されるメッセージ一覧が返される"""
            # Arrange
            typetalk_token = "valid_typetalk_token"
            topic_id = 6310
            from_id = 154011
            # APIレスポンスのプロパティ名はローワーキャメルケースで返す
            expected = {
                "topic": {
                    "id": 6310,
                    "name": "テストトピック1",
                    "description": "テストトピックの説明",
                },
                "hasNext": True,
                "posts": [
                    {
                        "id": 154010,
                        "message": "テストメッセージ2 abcdefg https://example.com/",
                        "updatedAt": "2024-09-11T12:34:56Z",
                        "account": {
                            "id": 2492,
                            "name": "test-user-02",
                            "imageUrl": "https://placehold.jp/150x150.png",
                        },
                        "sentiment": "POSITIVE",
                    },
                ],
            }

            # Act
            response = client.get(
                f"/topics/{topic_id}/messages?from_id={from_id}",
                headers={"x-typetalk-token": typetalk_token},
            )

            # Assert
            assert response.status_code == status.HTTP_200_OK
            content = response.json()
            assert content == expected

    class TestUnhappyCases:
        """異常系のテストケース"""

        @pytest.mark.parametrize(
            ("typetalk_token", "topic_id", "expected_status", "expected_content"),
            [
                (
                    "invalid_typetalk_token",
                    6310,
                    status.HTTP_401_UNAUTHORIZED,
                    {"title": "Typetalk API request failed."},
                ),
                (
                    "valid_typetalk_token",
                    0,
                    status.HTTP_404_NOT_FOUND,
                    {"title": "Typetalk API request failed."},
                ),
                (
                    "valid_typetalk_token",
                    "invalid_topic_id",
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                    {
                        "title": "Validation error occurred.",
                        "errors": [
                            {
                                "name": "topic_id",
                                "reason": (
                                    "Input should be a valid integer, "
                                    "unable to parse string as an integer"
                                ),
                            },
                        ],
                    },
                ),
            ],
            ids=[
                # 無効なトークンの場合、認証エラーが返される
                "when_invalid_token_provided_then_returns_unauthorized_error",
                # 無効なトピックIDの場合、404エラーが返される
                "when_invalid_topic_id_provided_then_returns_not_found_error",
                # トピックIDが文字列の場合、バリデーションエラーが返される
                "when_topic_id_is_string_then_returns_validation_error",
            ],
        )
        def test_when_invalid_input_provided_then_returns_error_response(
            self,
            typetalk_token: str,
            topic_id: int | str,
            expected_status: int,
            expected_content: dict,
        ) -> None:
            """無効な入力値が提供された場合にエラーレスポンスが返される"""
            # Arrange
            headers = {"x-typetalk-token": typetalk_token}

            # Act
            response = client.get(
                f"/topics/{topic_id}/messages",
                headers=headers,
            )

            # Assert
            assert response.status_code == expected_status
            content = response.json()
            assert content == expected_content

        @pytest.mark.parametrize(
            ("headers", "expected"),
            [
                (
                    None,
                    {
                        "title": "Validation error occurred.",
                        "errors": [
                            {"name": "x-typetalk-token", "reason": "Field required"}
                        ],
                    },
                ),
                (
                    {"x-typetalk-token": ""},
                    {
                        "title": "Validation error occurred.",
                        "errors": [
                            {
                                "name": "x-typetalk-token",
                                "reason": "String should have at least 1 character",
                            },
                        ],
                    },
                ),
            ],
            ids=[
                # トークンが未設定の場合、バリデーションエラーが返される
                "when_token_is_missing_then_returns_validation_error",
                # トークンが空文字の場合、バリデーションエラーが返される
                "when_token_is_empty_then_returns_validation_error",
            ],
        )
        def test_when_invalid_typetalk_token_provided_then_returns_error_response(
            self,
            headers: dict,
            expected: dict,
        ) -> None:
            """無効なトークンが提供された場合にエラーレスポンスが返される"""
            # Arrange
            topic_id = 6310
            from_id = 154011

            # Act
            response = client.get(
                f"/topics/{topic_id}/messages?from_id={from_id}",
                headers=headers,
            )

            # Assert
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
            content = response.json()
            assert content == expected

        def test_when_comprehend_error_occurs_then_returns_error_response(
            self,
            setup_dependency_aws_comprehend_api_mock_error: Generator[None, None, None],
        ) -> None:
            """AWS Comprehendのエラーでエラーレスポンスが返される"""
            # Arrange
            typetalk_token = "valid_typetalk_token"
            topic_id = 6310

            # Act
            response = client.get(
                f"/topics/{topic_id}/messages",
                headers={"x-typetalk-token": typetalk_token},
            )

            # Assert
            assert response.status_code == status.HTTP_400_BAD_REQUEST
            content = response.json()
            assert content == {
                "title": "AWS Comprehend API error occurred.",
                "detail": (
                    "TextSizeLimitExceededException: "
                    "テキストサイズが制限を超えています。最大: 5000文字"
                ),
            }

        def test_when_unexpected_error_occurs_then_returns_500_error(
            self,
            setup_dependency_typetalk_api_mock_error: Generator[None, None, None],
        ) -> None:
            """予期しないエラーでステータスコード500が返される"""
            # Arrange
            typetalk_token = "valid_typetalk_token"
            topic_id = 6310

            # Act
            response = client.get(
                f"/topics/{topic_id}/messages",
                headers={"x-typetalk-token": typetalk_token},
            )

            # Assert
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            content = response.json()
            assert content == {"title": "A system error has occurred."}
