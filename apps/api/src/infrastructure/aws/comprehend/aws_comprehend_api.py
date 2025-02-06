"""AWSのComprehendサービスを使用して、テキストの感情分析を行うクラスを定義する"""

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from src.infrastructure.aws.comprehend.aws_comprehend_models import (
    BatchDetectSentimentResponse,
)
from src.infrastructure.aws.comprehend.exceptions import (
    ComprehendError,
    ComprehendErrorType,
)
from src.infrastructure.aws.comprehend.i_aws_comprehend_api import IAwsComprehendApi


class AwsComprehendApi(IAwsComprehendApi):
    """AWS Comprehend APIを使用してテキストの感情分析を行うクラス"""

    MAX_BATCH_SIZE = 25
    MAX_TEXT_SIZE = 5000

    def _validate_input(self, text_list: list[str]) -> None:
        if not text_list:
            raise ComprehendError(
                ComprehendErrorType.INVALID_REQUEST,
                "テキストリストが空です。少なくとも1つのテキストを含める必要があります。",
            )

        if any(not text.strip() for text in text_list):
            raise ComprehendError(
                ComprehendErrorType.INVALID_REQUEST,
                "空の文字列または空白のみの文字列は許可されていません。",
            )

        if len(text_list) > self.MAX_BATCH_SIZE:
            raise ComprehendError(
                ComprehendErrorType.BATCH_SIZE_LIMIT_EXCEEDED,
                f"バッチサイズが制限を超えています。最大: {self.MAX_BATCH_SIZE}",
            )

        if any(len(text) > self.MAX_TEXT_SIZE for text in text_list):
            raise ComprehendError(
                ComprehendErrorType.TEXT_SIZE_LIMIT_EXCEEDED,
                f"テキストサイズが制限を超えています。最大: {self.MAX_TEXT_SIZE}文字",
            )

    def batch_detect_sentiment(
        self,
        text_list: list[str],
    ) -> BatchDetectSentimentResponse:
        """与えられたテキストリストの感情を検出する

        Args:
            text_list (list[str]): 感情を検出するテキストのリスト

        Returns:
            BatchDetectSentimentResponse: 感情分析の結果を含むレスポンスオブジェクト

        Raises:
            ComprehendError: Comprehend APIに関連するエラーが発生した場合

        References:
            - https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/comprehend/client/batch_detect_sentiment.html
            - https://docs.aws.amazon.com/comprehend/latest/APIReference/API_BatchDetectSentiment.html
        """
        self._validate_input(text_list)

        try:
            comprehend_client = boto3.client("comprehend")
            comprehend_response = comprehend_client.batch_detect_sentiment(
                TextList=text_list,
                LanguageCode="ja",
            )
            return BatchDetectSentimentResponse.model_validate(comprehend_response)
        except ClientError as error:
            error_code = error.response.get("Error", {}).get("Code", "UnknownException")
            error_message = error.response.get("Error", {}).get(
                "Message", "不明なエラーが発生しました"
            )
            error_type = ComprehendErrorType.from_aws_error_code(error_code)
            raise ComprehendError(error_type, error_message) from error
        except BotoCoreError as error:
            raise ComprehendError(
                ComprehendErrorType.API_ERROR, f"Boto3エラー: {str(error)}"
            ) from error
