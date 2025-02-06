"""AWS Comprehend のモデルクラスのテストケースを定義する"""

import pytest

from src.infrastructure.aws.comprehend.aws_comprehend_models import (
    SentimentEnum,
    SentimentResult,
)


class TestSentimentResult:
    """SentimentResult クラスのテストケース"""

    class TestValidateSentiment:
        """validate_sentiment メソッドのテストケース

        主にカスタムバリデーターのテストに焦点を当てている。
        基本的なフィールドの検証はPydanticに任せ、文字列からSentimentEnumへの
        変換が行われることを確認する。
        """

        @pytest.mark.parametrize(
            ("input_sentiment", "expected"),
            [
                ("POSITIVE", SentimentEnum.POSITIVE),  # 文字列からの変換
                (SentimentEnum.POSITIVE, SentimentEnum.POSITIVE),  # 既にEnum型
            ],
        )
        def test_valid_sentiment_converts_to_model(
            self,
            input_sentiment: str | SentimentEnum,
            expected: SentimentEnum,
        ) -> None:
            """有効な感情値がモデルのフィールドに変換される"""
            # Arrange
            aws_response = {
                "Index": 0,
                "Sentiment": input_sentiment,
                "SentimentScore": {
                    "Positive": 0.9,
                    "Negative": 0.1,
                    "Neutral": 0.0,
                    "Mixed": 0.0,
                },
            }

            # Act
            result = SentimentResult.model_validate(aws_response)

            # Assert
            assert result.sentiment == expected
            assert isinstance(result.sentiment, SentimentEnum)

        def test_invalid_sentiment_value_raises_error(self) -> None:
            """無効な感情値の場合は、カスタムバリデーターがエラーを発生させる"""
            # Arrange
            aws_response = {
                "Index": 0,
                "Sentiment": "HAPPY",  # 無効な感情値
                "SentimentScore": {
                    "Positive": 0.9,
                    "Negative": 0.1,
                    "Neutral": 0.0,
                    "Mixed": 0.0,
                },
            }

            # Act & Assert
            with pytest.raises(ValueError):
                SentimentResult.model_validate(aws_response)
