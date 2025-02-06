"""AWS Comprehend APIのモックを定義するクラスを提供する"""

from src.infrastructure.aws.comprehend.aws_comprehend_models import (
    BatchDetectSentimentResponse,
)
from src.infrastructure.aws.comprehend.exceptions import (
    ComprehendError,
    ComprehendErrorType,
)
from src.infrastructure.aws.comprehend.i_aws_comprehend_api import IAwsComprehendApi


class AwsComprehendApiMockError(IAwsComprehendApi):
    """テスト目的のための IAwsComprehendApi インターフェースのモック実装クラス

    各メソッドは常にComprehendErrorを発生させます。

    Note:
        本クラスは、テスト目的のためのモック実装である。本番環境では使用しないこと。
    """

    def batch_detect_sentiment(
        self, text_list: list[str]
    ) -> BatchDetectSentimentResponse:
        """テキストの感情分析を実行する

        このメソッドは常にComprehendErrorを発生させます。

        Args:
            text_list (list[str]): 分析対象のテキストリスト

        Raises:
            ComprehendError: テキストサイズ制限超過エラー

        Returns:
            list[str]: 感情分析結果のリスト
        """
        raise ComprehendError(
            ComprehendErrorType.TEXT_SIZE_LIMIT_EXCEEDED,
            "テキストサイズが制限を超えています。最大: 5000文字",
        )
