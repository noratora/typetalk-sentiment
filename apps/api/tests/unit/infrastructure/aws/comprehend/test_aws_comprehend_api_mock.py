"""AWS Comprehend API のモック実装のテストケースを定義する"""

from src.infrastructure.aws.comprehend.aws_comprehend_api_mock import (
    AwsComprehendApiMock,
)
from src.infrastructure.aws.comprehend.aws_comprehend_models import (
    SentimentEnum,
    SentimentResult,
)


class TestAwsComprehendApiMock:
    """AwsComprehendApiMock クラスのテストケース"""

    class TestBatchDetectSentiment:
        """batch_detect_sentiment メソッドのテストケース"""

        def test_return_expected_sentiment_and_scores(
            self,
            aws_comprehend_api_mock: AwsComprehendApiMock,
        ) -> None:
            """感情分析を実行すると、期待される感情と感情スコアが返される"""
            # Arrange
            text_list = ["test_message_01", "test_message_02", "test_message_03"]
            expected_sentiment = SentimentEnum.POSITIVE
            expected_scores = {
                "Positive": 88.8,
                "Negative": 12.3,
                "Neutral": 34.5,
                "Mixed": 45.6,
            }

            # Act
            response = aws_comprehend_api_mock.batch_detect_sentiment(text_list)

            # Assert
            assert len(response.result_list) == len(text_list)
            for index, result in enumerate(response.result_list):
                assert isinstance(result, SentimentResult)
                assert result.index == index
                assert result.sentiment == expected_sentiment
                assert result.sentiment_score == expected_scores
            assert len(response.error_list) == 0
