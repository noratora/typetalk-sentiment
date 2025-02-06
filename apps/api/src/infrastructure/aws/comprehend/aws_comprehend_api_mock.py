"""AWSのComprehendサービスのモックを定義するクラスを提供する"""

from src.infrastructure.aws.comprehend.aws_comprehend_models import (
    BatchDetectSentimentResponse,
    SentimentResult,
)
from src.infrastructure.aws.comprehend.i_aws_comprehend_api import IAwsComprehendApi


class AwsComprehendApiMock(IAwsComprehendApi):
    """テスト目的のための IAwsComprehendApi インターフェースのモック実装クラス

    Note:
        本クラスは、テスト目的のためのモック実装である。本番環境では使用しないこと。

        AWS のモックサービスには moto や LocalStack があるが、
        いずれも batch_detect_sentiment に対応してないため本クラスを作成した。
        ※ 2024/09/27 時点で非対応であることを確認している。

        moto は comprehend の batch_detect_sentiment に対応していない。
        https://docs.getmoto.org/en/latest/docs/services/comprehend.html

        LocalStack は comprehend に対応していない。
        GitHubイシューに要望は上がっている。
        https://github.com/localstack/localstack/issues/10065
    """

    def batch_detect_sentiment(
        self,
        text_list: list[str],
    ) -> BatchDetectSentimentResponse:
        """batch_detect_sentiment メソッドのモック実装

        Args:
            text_list (list[str]): 感情を検出するテキストのリスト

        Returns:
            BatchDetectSentimentResponse: 感情分析の結果を含むレスポンスオブジェクト
        """
        result_list = [
            SentimentResult.model_validate_json(f"""
                {{
                    "Index": {index},
                    "Sentiment": "POSITIVE",
                    "SentimentScore": {{
                        "Positive": 88.8,
                        "Negative": 12.3,
                        "Neutral": 34.5,
                        "Mixed": 45.6
                    }}
                }}
                """)
            for index, x in enumerate(text_list)
        ]

        return BatchDetectSentimentResponse(result_list=result_list, error_list=[])
