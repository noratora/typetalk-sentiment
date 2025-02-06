"""組織一覧取得APIのテストケースを定義する"""

from collections.abc import Generator

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app, raise_server_exceptions=False)


class TestGetSpacesApi:
    """組織一覧取得APIのテストクラス"""

    class TestHappyCases:
        """正常系のテストケース"""

        def test_when_valid_token_provided_then_returns_expected_spaces(
            self,
        ) -> None:
            """有効なTypetalkトークンを使用して期待される組織一覧が返される"""
            # Arrange
            typetalk_token = "valid_typetalk_token"
            # APIレスポンスのプロパティ名はローワーキャメルケースで返す
            expected = {
                "spaces": [
                    {
                        "key": "abcdefghij",
                        "name": "テスト組織1",
                        "imageUrl": "https://placehold.jp/150x150.png",
                    },
                    {
                        "key": "0123456789",
                        "name": "テスト組織2",
                        "imageUrl": "https://placehold.jp/150x150.png",
                    },
                ],
            }

            # Act
            response = client.get(
                "/spaces",
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
                            {
                                "name": "x-typetalk-token",
                                "reason": "Field required",
                            },
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
        def test_when_invalid_input_provided_then_returns_error_response(
            self,
            headers: dict,
            expected_status: int,
            expected_content: dict,
        ) -> None:
            """無効なトークンを使用するとエラーレスポンスが返される"""
            # Act
            response = client.get(
                "/spaces",
                headers=headers,
            )

            # Assert
            assert response.status_code == expected_status
            content = response.json()
            assert content == expected_content

        def test_when_unexpected_error_occurs_then_returns_500_error(
            self,
            setup_dependency_typetalk_api_mock_error: Generator[None, None, None],
        ) -> None:
            """予期しないエラーが発生した場合にステータスコード500が返される"""
            # Arrange
            typetalk_token = "valid_typetalk_token"

            # Act
            response = client.get(
                "/spaces",
                headers={"x-typetalk-token": typetalk_token},
            )

            # Assert
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            content = response.json()
            assert content == {"title": "A system error has occurred."}
