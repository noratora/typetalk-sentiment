"""AWS Comprehend APIのインテグレーションテストを定義する"""

import os

import pytest

from src.infrastructure.aws.comprehend.aws_comprehend_api import AwsComprehendApi
from src.infrastructure.aws.comprehend.aws_comprehend_models import (
    BatchDetectSentimentResponse,
    SentimentEnum,
)


# AWSの認証情報が設定されているかチェク
@pytest.mark.skipif(
    not (
        (os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("AWS_SECRET_ACCESS_KEY"))
        or os.getenv("AWS_PROFILE")
    ),
    reason="AWS credentials are not set",
)
@pytest.mark.integration
class TestAwsComprehendApiIntegration:
    """AWS Comprehend APIのインテグレーションテストクラス"""

    class TestBatchDetectSentiment:
        """batch_detect_sentimentメソッドのインテグレーションテストケース"""

        class TestHappyCases:
            """正常系のテストケース"""

            def test_when_valid_texts_provided_then_returns_expected_sentiments(
                self,
                aws_comprehend_api: AwsComprehendApi,
            ) -> None:
                """有効なテキストが提供された場合に期待される感情分析結果を返す

                Note:
                    このテストを実行するには、有効なAWS認証情報が必要である。
                    また、AWS利用料金が発生する可能性があるため、実行には注意が必要である。
                """
                # Arrange
                text_list = [
                    "これは素晴らしい日です。",
                    "天気が悪くて残念です。",
                    "普通の天気です。",
                    "晴れたり雨が降ったり曇ったりで複雑な天気です。",
                ]

                # Act
                result = aws_comprehend_api.batch_detect_sentiment(text_list)

                # Assert
                assert isinstance(result, BatchDetectSentimentResponse)
                assert len(result.result_list) == len(text_list)
                for sentiment_result in result.result_list:
                    assert sentiment_result.sentiment in SentimentEnum
                assert len(result.error_list) == 0

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
                aws_comprehend_api: AwsComprehendApi,
                text_list: list[str],
            ) -> None:
                """エッジケースの入力が提供された場合に期待される感情分析結果を返す

                Note:
                    このテストはAWS Comprehendの制限に近い状況をテストする。
                    実行時にはAWS利用料金に注意すること。
                """
                # Act
                result = aws_comprehend_api.batch_detect_sentiment(text_list)

                # Assert
                assert isinstance(result, BatchDetectSentimentResponse)
                assert len(result.result_list) == len(text_list)
                for sentiment_result in result.result_list:
                    assert sentiment_result.sentiment in SentimentEnum
                assert len(result.error_list) == 0
