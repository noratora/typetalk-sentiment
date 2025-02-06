"""Typetalk APIのテストケースを定義する"""

import pytest
from fastapi import status

from src.infrastructure.typetalk.exceptions import TypetalkAPIError
from src.infrastructure.typetalk.i_typetalk_api import ITypetalkApi
from src.schemas.account import Account
from src.schemas.message import Post, TypetalkGetMessagesResponse
from src.schemas.space import MySpace, Space, TypetalkGetSpacesResponse
from src.schemas.topic import MyTopic, Topic, TypetalkGetTopicsResponse


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
                """有効なトークンが提供された場合に期待される組織一覧が返される"""
                # Arrange
                typetalk_token = "valid_typetalk_token"
                expected = TypetalkGetSpacesResponse(
                    my_spaces=[
                        MySpace(
                            space=Space(
                                key="abcdefghij",
                                name="テスト組織1",
                                image_url="https://placehold.jp/150x150.png",
                            ),
                        ),
                        MySpace(
                            space=Space(
                                key="0123456789",
                                name="テスト組織2",
                                image_url="https://placehold.jp/150x150.png",
                            ),
                        ),
                    ],
                )

                # Act
                typetalk_get_spaces_response = typetalk_api.get_spaces(typetalk_token)

                # Assert
                assert typetalk_get_spaces_response == expected

        class TestUnhappyCases:
            """異常系のテストケース"""

            def test_when_invalid_token_provided_then_raises_unauthorized_error(
                self,
                typetalk_api: ITypetalkApi,
            ) -> None:
                """無効なトークンが提供された場合にエラーが発生する"""
                # Arrange
                invalid_typetalk_token = "invalid_typetalk_token"

                # Act
                with pytest.raises(TypetalkAPIError) as exc:
                    typetalk_api.get_spaces(invalid_typetalk_token)

                # Assert
                assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED
                assert exc.value.content is None

    class TestGetTopics:
        """get_topicsメソッドのテストケース"""

        class TestHappyCases:
            """正常系のテストケース"""

            def test_when_valid_input_provided_then_returns_expected_topics(
                self,
                typetalk_api: ITypetalkApi,
            ) -> None:
                """有効な入力が提供された場合に期待されるトピック一覧が返される"""
                # Arrange
                typetalk_token = "valid_typetalk_token"
                space_key = "valid_space_key"
                expected = TypetalkGetTopicsResponse(
                    topics=[
                        MyTopic(
                            topic=Topic(
                                id=6310,
                                name="テストトピック1",
                                description=None,
                            ),
                        ),
                        MyTopic(
                            topic=Topic(
                                id=6233,
                                name="テストトピック2",
                                description=None,
                            ),
                        ),
                    ],
                )

                # Act
                typetalk_get_topics_response = typetalk_api.get_topics(
                    typetalk_token, space_key
                )

                # Assert
                assert typetalk_get_topics_response == expected

        class TestUnhappyCases:
            """異常系のテストケース"""

            @pytest.mark.parametrize(
                (
                    "typetalk_token",
                    "space_key",
                    "expected_status_code",
                    "expected_content",
                ),
                [
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
                    # 組織キーが空文字列の場合、not found errorが返される
                    "when_space_key_is_empty_string_then_returns_not_found_error",
                    # 組織キーが無効な値の場合、not found errorが返される
                    "when_space_key_is_invalid_value_then_returns_not_found_error",
                ],
            )
            def test_when_invalid_input_provided_then_raises_error(
                self,
                typetalk_api: ITypetalkApi,
                typetalk_token: str,
                space_key: str,
                expected_status_code: int,
                expected_content: dict,
            ) -> None:
                """無効な入力が提供された場合にエラーが発生する"""
                # Act
                with pytest.raises(TypetalkAPIError) as exc:
                    typetalk_api.get_topics(typetalk_token, space_key)

                # Assert
                assert exc.value.status_code == expected_status_code
                assert exc.value.content == expected_content

    class TestGetMessages:
        """get_messagesメソッドのテストケース"""

        class TestHappyCases:
            """正常系のテストケース"""

            @pytest.mark.parametrize(
                ("typetalk_token", "topic_id", "from_id", "expected"),
                [
                    (
                        "valid_typetalk_token",
                        6310,
                        None,
                        TypetalkGetMessagesResponse(
                            topic=Topic(
                                id=6310,
                                name="テストトピック1",
                                description="テストトピックの説明",
                            ),
                            has_next=True,
                            posts=[
                                Post(
                                    id=154010,
                                    message="テストメッセージ2 abcdefg https://example.com/",
                                    updated_at="2024-09-11T12:34:56Z",
                                    account=Account(
                                        id=2492,
                                        name="test-user-02",
                                        image_url="https://placehold.jp/150x150.png",
                                    ),
                                    sentiment=None,
                                ),
                                Post(
                                    id=154011,
                                    message=(
                                        "テストメッセージ1 abcdefg "
                                        "あいうえおかきくけこさしすせそたちつてとなにぬねの"
                                    ),
                                    updated_at="2024-09-12T12:34:56Z",
                                    account=Account(
                                        id=2489,
                                        name="test-user-01",
                                        image_url="https://placehold.jp/150x150.png",
                                    ),
                                    sentiment=None,
                                ),
                            ],
                        ),
                    ),
                    (
                        "valid_typetalk_token",
                        6310,
                        154011,
                        TypetalkGetMessagesResponse(
                            topic=Topic(
                                id=6310,
                                name="テストトピック1",
                                description="テストトピックの説明",
                            ),
                            has_next=True,
                            posts=[
                                Post(
                                    id=154010,
                                    message="テストメッセージ2 abcdefg https://example.com/",
                                    updated_at="2024-09-11T12:34:56Z",
                                    account=Account(
                                        id=2492,
                                        name="test-user-02",
                                        image_url="https://placehold.jp/150x150.png",
                                    ),
                                    sentiment=None,
                                ),
                            ],
                        ),
                    ),
                ],
                ids=[
                    # from_idを指定しない場合、トピックの最新のメッセージが返される
                    "when_from_id_is_not_specified_then_returns_latest_messages",
                    # from_idを指定した場合、指定されたIDより前のメッセージが返される
                    "when_from_id_is_specified_then_returns_messages_before_that_id",
                ],
            )
            def test_when_valid_input_provided_then_returns_expected_messages(
                self,
                typetalk_api: ITypetalkApi,
                typetalk_token: str,
                topic_id: int,
                from_id: int | None,
                expected: TypetalkGetMessagesResponse,
            ) -> None:
                """有効な入力が提供された場合に期待されるメッセージ一覧が返される"""
                # Act
                typetalk_get_messages_response = typetalk_api.get_messages(
                    typetalk_token,
                    topic_id,
                    from_id,
                )

                # Assert
                assert typetalk_get_messages_response == expected

        class TestUnhappyCases:
            """異常系のテストケース"""

            def test_when_invalid_topic_id_provided_then_raises_not_found_error(
                self,
                typetalk_api: ITypetalkApi,
            ) -> None:
                """無効なトピックIDが提供された場合にエラーが発生する"""
                # Arrange
                typetalk_token = "valid_typetalk_token"
                invalid_topic_id = 0
                from_id = None

                # Act
                with pytest.raises(TypetalkAPIError) as exc:
                    typetalk_api.get_messages(typetalk_token, invalid_topic_id, from_id)

                # Assert
                assert exc.value.status_code == status.HTTP_404_NOT_FOUND
                assert exc.value.content == {}
