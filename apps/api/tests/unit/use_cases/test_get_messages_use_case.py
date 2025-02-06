"""get_messages_use_caseのテストモジュールを定義する"""

import pytest
from fastapi import status
from pytest_mock import MockerFixture

from src.infrastructure.aws.comprehend.aws_comprehend_api import AwsComprehendApi
from src.infrastructure.aws.comprehend.aws_comprehend_api_mock import (
    AwsComprehendApiMock,
)
from src.infrastructure.aws.comprehend.exceptions import (
    ComprehendError,
    ComprehendErrorType,
)
from src.infrastructure.typetalk.exceptions import TypetalkAPIError
from src.infrastructure.typetalk.i_typetalk_api import ITypetalkApi
from src.schemas.account import Account
from src.schemas.message import GetMessagesResponse, Post
from src.schemas.topic import Topic
from src.use_cases.get_messages import get_messages_use_case


class TestGetMessagesUseCase:
    """get_messages_use_caseのテストクラス

    Typetalk APIとの通信をモックでシミュレートし、基本的な動作を検証する。
    """

    class TestHappyCases:
        """正常系のテストケース"""

        @pytest.mark.parametrize(
            ("typetalk_token", "topic_id", "from_id", "expected"),
            [
                (
                    "valid_typetalk_token",
                    6310,
                    None,
                    GetMessagesResponse(
                        topic=Topic(
                            id=6310,
                            name="テストトピック1",
                            description="テストトピックの説明",
                        ),
                        has_next=True,
                        # posts は id の降順に並べ替える
                        posts=[
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
                                # 感情分析の結果が入る
                                sentiment="POSITIVE",
                            ),
                            Post(
                                id=154010,
                                message="テストメッセージ2 abcdefg https://example.com/",
                                updated_at="2024-09-11T12:34:56Z",
                                account=Account(
                                    id=2492,
                                    name="test-user-02",
                                    image_url="https://placehold.jp/150x150.png",
                                ),
                                # 感情分析の結果が入る
                                sentiment="POSITIVE",
                            ),
                        ],
                    ),
                ),
                (
                    "valid_typetalk_token",
                    6310,
                    154011,
                    GetMessagesResponse(
                        topic=Topic(
                            id=6310,
                            name="テストトピック1",
                            description="テストトピックの説明",
                        ),
                        has_next=True,
                        # posts は id の降順に並べ替える
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
                                # 感情分析の結果が入る
                                sentiment="POSITIVE",
                            ),
                        ],
                    ),
                ),
                (
                    "valid_typetalk_token",
                    390668,
                    None,
                    GetMessagesResponse(
                        topic=Topic(
                            id=390668,
                            name="分析対象メッセージ0件のトピック",
                            description="",
                        ),
                        has_next=False,
                        # posts は id の降順に並べ替える
                        posts=[
                            Post(
                                id=126996578,
                                message="",
                                updated_at="2024-02-17T15:32:09Z",
                                account=Account(
                                    id=2492,
                                    name="test-user-02",
                                    image_url="https://placehold.jp/150x150.png",
                                ),
                                # メッセージ本文が空のため感情分析の結果は無し
                                sentiment=None,
                            ),
                            Post(
                                id=126996574,
                                message="",
                                updated_at="2024-02-17T15:31:53Z",
                                account=Account(
                                    id=2492,
                                    name="test-user-02",
                                    image_url="https://placehold.jp/150x150.png",
                                ),
                                # メッセージ本文が空のため感情分析の結果は無し
                                sentiment=None,
                            ),
                        ],
                    ),
                ),
            ],
            ids=[
                # from_idが指定されていない場合、トピックの最新のメッセージが返される
                "when_from_id_is_not_specified_then_returns_latest_messages",
                # from_idが指定されている場合、指定されたIDより前のメッセージが返される
                "when_from_id_is_specified_then_returns_messages_before_that_id",
                # メッセージ本文が空の場合、感情分析結果なしのメッセージが返される
                "when_message_body_empty_then_returns_messages_without_sentiment",
            ],
        )
        def test_when_valid_input_provided_then_returns_expected_messages(
            self,
            typetalk_api: ITypetalkApi,
            aws_comprehend_api_mock: AwsComprehendApiMock,
            typetalk_token: str,
            topic_id: int,
            from_id: int | None,
            expected: GetMessagesResponse,
        ) -> None:
            """有効な入力値が提供された場合に期待されるメッセージ一覧が返される"""
            # Act
            response = get_messages_use_case(
                typetalk_api,
                aws_comprehend_api_mock,
                typetalk_token,
                topic_id,
                from_id,
            )

            # Assert
            assert response == expected

    class TestUnhappyCases:
        """異常系のテストケース"""

        @pytest.mark.parametrize(
            (
                "typetalk_token",
                "topic_id",
                "from_id",
                "expected_status",
                "expected_content",
            ),
            [
                (
                    "invalid_typetalk_token",
                    6310,
                    None,
                    status.HTTP_401_UNAUTHORIZED,
                    None,
                ),
                ("valid_typetalk_token", 0, None, status.HTTP_404_NOT_FOUND, {}),
            ],
            ids=[
                # 無効なトークンの場合、認証エラーが発生する
                "when_invalid_token_is_provided_then_raises_unauthorized_error",
                # 無効なトピックIDの場合、Not Foundエラーが発生する
                "when_invalid_topic_is_provided_then_raises_not_found_error",
            ],
        )
        def test_when_invalid_input_provided_then_raises_typetalk_api_error(
            self,
            typetalk_api: ITypetalkApi,
            aws_comprehend_api_mock: AwsComprehendApiMock,
            typetalk_token: str,
            topic_id: int,
            from_id: int | None,
            expected_status: int,
            expected_content: dict,
        ) -> None:
            """無効な入力値が提供された場合にTypetalkAPIErrorが発生する"""
            # Act
            with pytest.raises(TypetalkAPIError) as exc:
                get_messages_use_case(
                    typetalk_api,
                    aws_comprehend_api_mock,
                    typetalk_token,
                    topic_id,
                    from_id,
                )

            # Assert
            assert exc.value.status_code == expected_status
            assert exc.value.content == expected_content

        @pytest.mark.parametrize(
            ("text_list", "error_type", "expected_message"),
            [
                (
                    ["a" * 5001],  # MAX_TEXT_SIZE超過
                    ComprehendErrorType.TEXT_SIZE_LIMIT_EXCEEDED,
                    (
                        "TextSizeLimitExceededException: "
                        "テキストサイズが制限を超えています。最大: 5000文字"
                    ),
                ),
                (
                    ["テスト"] * 26,  # MAX_BATCH_SIZE超過
                    ComprehendErrorType.BATCH_SIZE_LIMIT_EXCEEDED,
                    (
                        "BatchSizeLimitExceededException: "
                        "バッチサイズが制限を超えています。最大: 25"
                    ),
                ),
            ],
            ids=[
                # テキストサイズが制限を超えた場合、エラーが発生する
                "when_text_size_exceeds_limit_then_raises_comprehend_error",
                # バッチサイズが制限を超えた場合、エラーが発生する
                "when_batch_size_exceeds_limit_then_raises_comprehend_error",
            ],
        )
        def test_when_comprehend_limit_exceeded_then_raises_comprehend_error(
            self,
            mocker: MockerFixture,
            typetalk_api: ITypetalkApi,
            aws_comprehend_api: AwsComprehendApi,
            text_list: list[str],
            error_type: ComprehendErrorType,
            expected_message: str,
        ) -> None:
            """AWS Comprehendの制限超過でComprehendErrorが発生する"""
            # Arrange
            typetalk_token = "valid_typetalk_token"
            topic_id = 6310
            from_id = None
            # Typetalk APIのレスポンスをモック
            mock_response = GetMessagesResponse(
                topic=Topic(
                    id=topic_id,
                    name="テストトピック",
                    description="",
                ),
                has_next=False,
                posts=[
                    Post(
                        id=i,
                        message=message,
                        updated_at="2024-01-23T00:00:00Z",
                        account=Account(
                            id=1,
                            name="test",
                            image_url="",
                        ),
                        sentiment=None,
                    )
                    for i, message in enumerate(text_list)
                ],
            )
            mocker.patch.object(
                typetalk_api, "get_messages", return_value=mock_response
            )

            # Act & Assert
            with pytest.raises(ComprehendError) as exc:
                get_messages_use_case(
                    typetalk_api,
                    aws_comprehend_api,
                    typetalk_token,
                    topic_id,
                    from_id,
                )

            assert exc.value.error_type == error_type
            assert str(exc.value) == expected_message
