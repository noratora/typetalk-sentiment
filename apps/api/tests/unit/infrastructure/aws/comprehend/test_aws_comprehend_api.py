"""AWS Comprehend APIのテストケースを定義する"""

from unittest.mock import Mock

import pytest
from botocore.exceptions import BotoCoreError, ClientError
from pytest_mock import MockerFixture

from src.infrastructure.aws.comprehend.aws_comprehend_api import AwsComprehendApi
from src.infrastructure.aws.comprehend.aws_comprehend_models import (
    BatchDetectSentimentResponse,
    SentimentEnum,
)
from src.infrastructure.aws.comprehend.exceptions import (
    ComprehendError,
    ComprehendErrorType,
)


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

        class TestHappyCases:
            """正常系のテストケース"""

            def test_when_valid_texts_provided_then_returns_expected_sentiments(
                self,
                mocker: MockerFixture,
                mock_comprehend_client: Mock,
                aws_comprehend_api: AwsComprehendApi,
            ) -> None:
                """有効なテキストが提供された場合に期待される感情分析結果を返す"""
                # Arrange
                text_list = [
                    "これは素晴らしい日です。",
                    "天気が悪くて残念です。",
                    "普通の天気です。",
                    "晴れたり雨が降ったり曇ったりで複雑な天気です。",
                ]
                expected_sentiments = [
                    SentimentEnum.POSITIVE,
                    SentimentEnum.NEGATIVE,
                    SentimentEnum.NEUTRAL,
                    SentimentEnum.MIXED,
                ]
                mock_response = {
                    "ResultList": [
                        {
                            "Index": i,
                            "Sentiment": sentiment.value,
                            "SentimentScore": {
                                "Positive": 0.25,
                                "Negative": 0.25,
                                "Neutral": 0.25,
                                "Mixed": 0.25,
                            },
                        }
                        for i, sentiment in enumerate(expected_sentiments)
                    ],
                    "ErrorList": [],
                }
                mock_comprehend_client.batch_detect_sentiment.return_value = (
                    mock_response
                )
                mocker.patch("boto3.client", return_value=mock_comprehend_client)

                # Act
                result = aws_comprehend_api.batch_detect_sentiment(text_list)

                # Assert
                assert isinstance(result, BatchDetectSentimentResponse)
                assert len(result.result_list) == len(text_list)
                for i, sentiment_result in enumerate(result.result_list):
                    assert sentiment_result.sentiment == expected_sentiments[i]
                assert len(result.error_list) == 0
                mock_comprehend_client.batch_detect_sentiment.assert_called_once_with(
                    TextList=text_list,
                    LanguageCode="ja",
                )

            @pytest.mark.parametrize(
                "text_list",
                [
                    (["a"]),
                    (["a" * AwsComprehendApi.MAX_TEXT_SIZE]),
                    (["テストテキスト"]),
                    (["テスト"] * AwsComprehendApi.MAX_BATCH_SIZE),
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
                self,
                mocker: MockerFixture,
                mock_comprehend_client: Mock,
                aws_comprehend_api: AwsComprehendApi,
                text_list: list[str],
            ) -> None:
                """エッジケースの入力が提供された場合に期待される感情分析結果を返す"""
                # Arrange
                expected_result_count = len(text_list)
                mock_response = {
                    "ResultList": [
                        {
                            "Index": i,
                            "Sentiment": SentimentEnum.NEUTRAL,
                            "SentimentScore": {
                                "Positive": 0.25,
                                "Negative": 0.25,
                                "Neutral": 0.5,
                                "Mixed": 0.0,
                            },
                        }
                        for i in range(expected_result_count)
                    ],
                    "ErrorList": [],
                }
                mock_comprehend_client.batch_detect_sentiment.return_value = (
                    mock_response
                )
                mocker.patch("boto3.client", return_value=mock_comprehend_client)

                # Act
                result = aws_comprehend_api.batch_detect_sentiment(text_list)

                # Assert
                assert isinstance(result, BatchDetectSentimentResponse)
                assert len(result.result_list) == expected_result_count
                for sentiment_result in result.result_list:
                    assert sentiment_result.sentiment == SentimentEnum.NEUTRAL
                assert len(result.error_list) == 0
                mock_comprehend_client.batch_detect_sentiment.assert_called_once_with(
                    TextList=text_list,
                    LanguageCode="ja",
                )

        class TestUnhappyCases:
            """異常系のテストケース"""

            def test_when_empty_list_is_provided_then_raises_invalid_request_error(
                self, aws_comprehend_api: AwsComprehendApi
            ) -> None:
                """空のリストが提供された場合にComprehendErrorを発生させる"""
                # Arrange
                text_list: list[str] = []

                # Act & Assert
                with pytest.raises(ComprehendError) as exc_info:
                    aws_comprehend_api.batch_detect_sentiment(text_list)

                assert exc_info.value.error_type == ComprehendErrorType.INVALID_REQUEST
                assert str(exc_info.value.message) == (
                    "テキストリストが空です。少なくとも1つのテキストを含める必要があります。"
                )

            @pytest.mark.parametrize(
                "text_list, expected_error_message",
                [
                    (
                        ["", "テスト"],
                        "空の文字列または空白のみの文字列は許可されていません",
                    ),
                    (
                        ["  ", "テスト"],
                        "空の文字列または空白のみの文字列は許可されていません",
                    ),
                ],
                ids=[
                    # 空文字列を含むリストの場合にエラーが発生する
                    "when_list_contains_empty_string_then_raises_invalid_request_error",
                    # 空白のみの文字列を含むリストの場合にエラーが発生する
                    "when_list_contains_whitespace_only_then_raises_invalid_request_error",
                ],
            )
            def test_when_invalid_string_is_provided_then_raises_invalid_request_error(
                self,
                aws_comprehend_api: AwsComprehendApi,
                text_list: list[str],
                expected_error_message: str,
            ) -> None:
                """空の文字列または空白のみの文字列を含むリストが提供された場合にComprehendErrorを発生させる"""
                # Act & Assert
                with pytest.raises(ComprehendError) as exc_info:
                    aws_comprehend_api.batch_detect_sentiment(text_list)

                assert exc_info.value.error_type == ComprehendErrorType.INVALID_REQUEST
                assert expected_error_message in str(exc_info.value)

            def test_when_batch_size_limit_exceeded_then_raises_batch_size_error(
                self,
                aws_comprehend_api: AwsComprehendApi,
            ) -> None:
                """バッチサイズ制限を超えた場合にComprehendErrorを発生させる"""
                # Arrange
                text_list = ["テスト"] * (AwsComprehendApi.MAX_BATCH_SIZE + 1)

                # Act & Assert
                with pytest.raises(ComprehendError) as exc_info:
                    aws_comprehend_api.batch_detect_sentiment(text_list)

                assert (
                    exc_info.value.error_type
                    == ComprehendErrorType.BATCH_SIZE_LIMIT_EXCEEDED
                )

            def test_when_text_size_limit_exceeded_then_raises_text_size_error(
                self,
                aws_comprehend_api: AwsComprehendApi,
            ) -> None:
                """テキストサイズ制限を超えた場合にComprehendErrorを発生させる"""
                # Arrange
                text_list = ["a" * (AwsComprehendApi.MAX_TEXT_SIZE + 1)]

                # Act & Assert
                with pytest.raises(ComprehendError) as exc_info:
                    aws_comprehend_api.batch_detect_sentiment(text_list)

                assert (
                    exc_info.value.error_type
                    == ComprehendErrorType.TEXT_SIZE_LIMIT_EXCEEDED
                )

            @pytest.mark.parametrize(
                "error_code, expected_error_type, expected_status_code",
                [
                    (
                        "InvalidRequestException",
                        ComprehendErrorType.INVALID_REQUEST,
                        400,
                    ),
                    (
                        "InternalServerException",
                        ComprehendErrorType.INTERNAL_SERVER,
                        500,
                    ),
                    ("ThrottlingException", ComprehendErrorType.THROTTLING, 429),
                    (
                        "UnsupportedLanguageException",
                        ComprehendErrorType.UNSUPPORTED_LANGUAGE,
                        400,
                    ),
                    ("UnknownException", ComprehendErrorType.UNKNOWN, 500),
                ],
                ids=[
                    # クライアントエラーの場合、InvalidRequestエラーが発生する
                    "when_invalid_request_error_occurs_then_raises_invalid_request_error",
                    # サーバーエラーの場合、InternalServerエラーが発生する
                    "when_internal_server_error_occurs_then_raises_internal_server_error",
                    # スロットリングの場合、Throttlingエラーが発生する
                    "when_throttling_occurs_then_raises_throttling_error",
                    # 未サポート言語の場合、UnsupportedLanguageエラーが発生する
                    "when_unsupported_language_used_then_raises_unsupported_language_error",
                    # 未知のエラーの場合、Unknownエラーが発生する
                    "when_unknown_error_occurs_then_raises_unknown_error",
                ],
            )
            def test_when_client_error_occurs_then_raises_comprehend_error(
                self,
                mocker: MockerFixture,
                mock_comprehend_client: Mock,
                aws_comprehend_api: AwsComprehendApi,
                error_code: str,
                expected_error_type: ComprehendErrorType,
                expected_status_code: int,
            ) -> None:
                """AWS SDKのエラーエラーが発生した場合にComprehendErrorに変換して発生させる"""
                # Arrange
                text_list = ["テスト"]
                mock_comprehend_client.batch_detect_sentiment.side_effect = ClientError(
                    {
                        "Error": {
                            "Code": error_code,
                            "Message": "エラーメッセージ",
                        }
                    },
                    "BatchDetectSentiment",
                )
                mocker.patch("boto3.client", return_value=mock_comprehend_client)

                # Act & Assert
                with pytest.raises(ComprehendError) as exc_info:
                    aws_comprehend_api.batch_detect_sentiment(text_list)

                assert exc_info.value.error_type == expected_error_type
                assert exc_info.value.status_code == expected_status_code
                assert error_code in str(exc_info.value)

            def test_when_boto_core_error_occurs_then_raises_api_error(
                self,
                mocker: MockerFixture,
                mock_comprehend_client: Mock,
                aws_comprehend_api: AwsComprehendApi,
            ) -> None:
                """BotoCoreErrorエラーが発生した場合にComprehendErrorに変換して発生させる"""
                # Arrange
                text_list = ["テスト"]
                mock_comprehend_client.batch_detect_sentiment.side_effect = (
                    BotoCoreError()
                )
                mocker.patch("boto3.client", return_value=mock_comprehend_client)

                # Act & Assert
                with pytest.raises(ComprehendError) as exc_info:
                    aws_comprehend_api.batch_detect_sentiment(text_list)

                assert exc_info.value.error_type == ComprehendErrorType.API_ERROR
