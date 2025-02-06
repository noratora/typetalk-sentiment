"""get_topics_use_caseのテストモジュールを定義する"""

import pytest
from fastapi import status

from src.infrastructure.typetalk.exceptions import TypetalkAPIError
from src.infrastructure.typetalk.i_typetalk_api import ITypetalkApi
from src.schemas.topic import GetTopicsResponse, Topic
from src.use_cases.get_topics import get_topics_use_case


class TestGetTopicsUseCase:
    """get_topics_use_caseのテストクラス

    Typetalk APIとの通信をモックでシミュレートし、基本的な動作を検証する。
    """

    class TestHappyCases:
        """正常系のテストケース"""

        def test_when_valid_input_provided_then_returns_expected_topics(
            self,
            typetalk_api: ITypetalkApi,
        ) -> None:
            """有効な入力値が提供された場合に期待されるトピック一覧が返される"""
            # Arrange
            typetalk_token = "valid_typetalk_token"
            space_key = "valid_space_key"
            expected = GetTopicsResponse(
                topics=[
                    Topic(
                        id=6310,
                        name="テストトピック1",
                        description=None,
                    ),
                    Topic(
                        id=6233,
                        name="テストトピック2",
                        description=None,
                    ),
                ],
            )

            # Act
            response = get_topics_use_case(typetalk_api, typetalk_token, space_key)

            # Assert
            assert response == expected

    class TestUnhappyCases:
        """異常系のテストケース"""

        @pytest.mark.parametrize(
            ("typetalk_token", "space_key", "expected_status", "expected_content"),
            [
                (
                    "invalid_typetalk_token",
                    "valid_space_key",
                    status.HTTP_401_UNAUTHORIZED,
                    None,
                ),
                (
                    "valid_typetalk_token",
                    "",
                    status.HTTP_404_NOT_FOUND,
                    {"error": {"title": "The space not found."}},
                ),
                (
                    "valid_typetalk_token",
                    "invalid",
                    status.HTTP_404_NOT_FOUND,
                    {"error": {"title": "The space not found."}},
                ),
            ],
            ids=[
                # 無効なトークンの場合、認証エラーが発生する
                "when_invalid_token_provided_then_raises_unauthorized_error",
                # 組織キーが空文字列の場合、not found errorが発生する
                "when_space_key_is_empty_then_raises_not_found_error",
                # 組織キーが無効な値の場合、not found errorが発生する
                "when_space_key_is_invalid_then_raises_not_found_error",
            ],
        )
        def test_when_invalid_input_provided_then_raises_typetalk_api_error(
            self,
            typetalk_api: ITypetalkApi,
            typetalk_token: str,
            space_key: str,
            expected_status: int,
            expected_content: dict,
        ) -> None:
            """無効な入力値が提供された場合にTypetalkAPIErrorが発生する"""
            # Act & Assert
            with pytest.raises(TypetalkAPIError) as exc:
                get_topics_use_case(typetalk_api, typetalk_token, space_key)

            assert exc.value.status_code == expected_status
            assert exc.value.content == expected_content
