"""AWS Comprehend APIに関連する例外とエラータイプを定義する"""

from enum import Enum

from src.exceptions.exceptions import AppBaseError


class ComprehendErrorType(Enum):
    """AWS Comprehend APIのエラータイプを定義する列挙型

    各エラータイプは (AWS SDKのエラーコード, HTTPステータスコード) の
    タプルを値として持ちます。

    References:
        https://boto3.amazonaws.com/v1/documentation/api/latest/guide/error-handling.html
    """

    BATCH_SIZE_LIMIT_EXCEEDED = ("BatchSizeLimitExceededException", 400)
    INTERNAL_SERVER = ("InternalServerException", 500)
    INVALID_REQUEST = ("InvalidRequestException", 400)
    TEXT_SIZE_LIMIT_EXCEEDED = ("TextSizeLimitExceededException", 400)
    UNSUPPORTED_LANGUAGE = ("UnsupportedLanguageException", 400)
    THROTTLING = ("ThrottlingException", 429)
    API_ERROR = ("APIError", 500)
    UNKNOWN = ("UnknownException", 500)

    @classmethod
    def from_aws_error_code(cls, error_code: str) -> "ComprehendErrorType":
        """AWS SDKのエラーコードに対応するComprehendErrorTypeを返す

        一致するエラーコードがない場合は UNKNOWN を返す。
        """
        for error_type in cls:
            if error_type.value[0] == error_code:
                return error_type
        return cls.UNKNOWN


class ComprehendError(AppBaseError):
    """AWS Comprehend APIに関連するエラーを表す例外クラス"""

    def __init__(self, error_type: ComprehendErrorType, message: str):
        """ComprehendErrorの初期化

        Args:
            error_type (ComprehendErrorType): エラーの種類
            message (str): エラーメッセージ
        """
        self.error_type = error_type
        self.message = message
        self.status_code = error_type.value[1]

    def __str__(self) -> str:
        """オブジェクトの文字列表現を返す"""
        return f"{self.error_type.value[0]}: {self.message}"
