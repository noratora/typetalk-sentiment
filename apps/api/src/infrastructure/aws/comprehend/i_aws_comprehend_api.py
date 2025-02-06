"""AWS Comprehend APIのインターフェースを定義する抽象基底クラスを提供する"""

from abc import ABC, abstractmethod

from src.infrastructure.aws.comprehend.aws_comprehend_models import (
    BatchDetectSentimentResponse,
)


class IAwsComprehendApi(ABC):
    """AWS Comprehend APIのインターフェースを定義する抽象基底クラス"""

    @abstractmethod
    def batch_detect_sentiment(
        self,
        text_list: list[str],
    ) -> BatchDetectSentimentResponse:
        """与えられたテキストリストの感情を検出する

        Args:
            text_list (list[str]): 対象のテキストリスト

        Returns:
            BatchDetectSentimentResponse: 感情分析の結果を含むレスポンスオブジェクト
        """
