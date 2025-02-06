"""get_spaces_use_caseのテストモジュールを定義する"""

import pytest
from fastapi import status

from src.infrastructure.typetalk.exceptions import TypetalkAPIError
from src.infrastructure.typetalk.i_typetalk_api import ITypetalkApi
from src.schemas.space import GetSpacesResponse, Space
from src.use_cases.get_spaces import get_spaces_use_case


class TestGetSpacesUseCase:
    """get_spaces_use_caseのテストクラス

    Typetalk APIとの通信をモックでシミュレートし、基本的な動作を検証する。
    """

    class TestHappyCases:
        """正常系のテストケース"""

        def test_when_valid_token_provided_then_returns_expected_spaces(
            self,
            typetalk_api: ITypetalkApi,
        ) -> None:
            """有効なトークンが提供された場合に期待される組織一覧が返される"""
            # Arrange
            typetalk_token = "valid_typetalk_token"
            expected = GetSpacesResponse(
                spaces=[
                    Space(
                        key="abcdefghij",
                        name="テスト組織1",
                        image_url="https://placehold.jp/150x150.png",
                    ),
                    Space(
                        key="0123456789",
                        name="テスト組織2",
                        image_url="https://placehold.jp/150x150.png",
                    ),
                ],
            )

            # Act
            response = get_spaces_use_case(typetalk_api, typetalk_token)

            # Assert
            assert response == expected

    class TestUnhappyCases:
        """異常系のテストケース"""

        def test_when_invalid_token_provided_then_raises_unauthorized_error(
            self,
            typetalk_api: ITypetalkApi,
        ) -> None:
            """無効なトークンが提供された場合にTypetalkAPIErrorが発生する"""
            # Arrange
            invalid_typetalk_token = "invalid_typetalk_token"

            # Act & Assert
            with pytest.raises(TypetalkAPIError) as exc:
                get_spaces_use_case(typetalk_api, invalid_typetalk_token)

            assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED
            assert exc.value.content is None
