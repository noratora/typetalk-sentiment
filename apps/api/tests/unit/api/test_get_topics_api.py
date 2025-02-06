"""トピック一覧取得APIのテストケースを定義する"""

from collections.abc import Generator

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app, raise_server_exceptions=False)


class TestGetTopicsApi:
    """トピック一覧取得APIのテストクラス"""

    class TestHappyCases:
        """正常系のテストケース"""

        def test_when_valid_token_and_space_key_provided_then_returns_expected_topics(
            self,
        ) -> None:
            """有効なトークンと組織キーで期待されるトピック一覧が返される"""
            # Arrange
            typetalk_token = "valid_typetalk_token"
            space_key = "valid_space_key"
            # APIレスポンスのプロパティ名はローワーキャメルケースで返す
            expected = {
                "topics": [
                    {
                        "id": 6310,
                        "name": "テストトピック1",
                        "description": None,
                    },
                    {
                        "id": 6233,
                        "name": "テストトピック2",
                        "description": None,
                    },
                ],
            }

            # Act
            response = client.get(
                f"/topics?space_key={space_key}",
                headers={"x-typetalk-token": typetalk_token},
            )

            # Assert
            assert response.status_code == status.HTTP_200_OK
            content = response.json()
            assert content == expected

    class TestUnhappyCases:
        """異常系のテストケース"""

        @pytest.mark.parametrize(
            ("headers", "expected_status", "expected_content"),
            [
                (
                    {"x-typetalk-token": "invalid_typetalk_token"},
                    status.HTTP_401_UNAUTHORIZED,
                    {"title": "Typetalk API request failed."},
                ),
                (
                    None,
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                    {
                        "title": "Validation error occurred.",
                        "errors": [
                            {"name": "x-typetalk-token", "reason": "Field required"}
                        ],
                    },
                ),
                (
                    {"x-typetalk-token": ""},
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
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
                # 無効なトークンの場合、認証エラーが返される
                "when_invalid_token_provided_then_returns_unauthorized_error",
                # トークンが未設定の場合、バリデーションエラーが返される
                "when_token_is_missing_then_returns_validation_error",
                # トークンが空文字の場合、バリデーションエラーが返される
                "when_token_is_empty_then_returns_validation_error",
            ],
        )
        def test_when_invalid_token_provided_then_returns_error_response(
            self,
            headers: dict,
            expected_status: int,
            expected_content: dict,
        ) -> None:
            """無効なトークンでエラーレスポンスが返される"""
            # Arrange
            space_key = "valid_space_key"

            # Act
            response = client.get(
                f"/topics?space_key={space_key}",
                headers=headers,
            )

            # Assert
            assert response.status_code == expected_status
            content = response.json()
            assert content == expected_content

        @pytest.mark.parametrize(
            "space_key, expected_status, expected_content",
            [
                (
                    "invalid",
                    status.HTTP_404_NOT_FOUND,
                    {
                        "title": "Typetalk API request failed.",
                        "detail": {"title": "The space not found."},
                    },
                ),
                (
                    "",
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                    {
                        "title": "Validation error occurred.",
                        "errors": [
                            {
                                "name": "space_key",
                                "reason": "String should have at least 1 character",
                            },
                        ],
                    },
                ),
            ],
            ids=[
                # 無効な組織キーの場合、404エラーが返される
                "when_invalid_space_key_provided_then_returns_not_found_error",
                # 組織キーが空文字の場合、バリデーションエラーが返される
                "when_space_key_is_empty_then_returns_validation_error",
            ],
        )
        def test_when_invalid_space_key_provided_then_returns_error_response(
            self,
            space_key: str,
            expected_status: int,
            expected_content: dict,
        ) -> None:
            """無効な組織キーでエラーレスポンスが返される"""
            # Arrange
            typetalk_token = "valid_typetalk_token"

            # Act
            response = client.get(
                f"/topics?space_key={space_key}",
                headers={"x-typetalk-token": typetalk_token},
            )

            # Assert
            assert response.status_code == expected_status
            content = response.json()
            assert content == expected_content

        @pytest.mark.parametrize(
            ("url", "expected"),
            [
                (
                    "/topics",
                    {
                        "title": "Validation error occurred.",
                        "errors": [
                            {
                                "name": "space_key",
                                "reason": "Field required",
                            },
                        ],
                    },
                ),
                (
                    "/topics?space_key=",
                    {
                        "title": "Validation error occurred.",
                        "errors": [
                            {
                                "name": "space_key",
                                "reason": "String should have at least 1 character",
                            },
                        ],
                    },
                ),
            ],
            ids=[
                # 組織キーが未設定の場合、バリデーションエラーが返される
                "when_space_key_is_missing_then_returns_validation_error",
                # 組織キーが空文字の場合、バリデーションエラーが返される
                "when_space_key_is_empty_then_returns_validation_error",
            ],
        )
        def test_when_space_key_is_missing_then_returns_error_response(
            self,
            url: str,
            expected: dict,
        ) -> None:
            """組織キーなしでエラーレスポンスが返される"""
            # Arrange
            typetalk_token = "valid_typetalk_token"

            # Act
            response = client.get(
                url,
                headers={"x-typetalk-token": typetalk_token},
            )

            # Assert
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
            content = response.json()
            assert content == expected

        def test_when_unexpected_error_occurs_then_returns_500_error(
            self,
            setup_dependency_typetalk_api_mock_error: Generator[None, None, None],
        ) -> None:
            """予期しないエラーでステータスコード500が返される"""
            # Arrange
            typetalk_token = "valid_typetalk_token"
            space_key = "valid_space_key"

            # Act
            response = client.get(
                f"/topics?space_key={space_key}",
                headers={"x-typetalk-token": typetalk_token},
            )

            # Assert
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            content = response.json()
            assert content == {"title": "A system error has occurred."}
