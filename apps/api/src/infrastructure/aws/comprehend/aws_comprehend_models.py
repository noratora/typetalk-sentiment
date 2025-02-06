"""AWS Comprehendのモデルを定義する"""

from enum import Enum

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_pascal


class BaseComprehendModel(BaseModel):
    """AWS Comprehend のモデルの基底クラス

    JSONのプロパティ名をパスカルケースで扱う
    """

    model_config = ConfigDict(
        alias_generator=to_pascal,
        populate_by_name=True,
        strict=True,
    )


class SentimentEnum(Enum):
    """AWS Comprehend によるセンチメント分析の感情を表す列挙型"""

    POSITIVE = "POSITIVE"
    NEGATIVE = "NEGATIVE"
    NEUTRAL = "NEUTRAL"
    MIXED = "MIXED"


class SentimentResult(BaseComprehendModel):
    """BatchDetectSentiment の中の結果を表すモデル"""

    index: int
    sentiment: SentimentEnum
    sentiment_score: dict[str, float]

    @field_validator("sentiment", mode="before")
    @classmethod
    def validate_sentiment(cls, v: str | SentimentEnum) -> SentimentEnum:
        """文字列または SentimentEnum を検証し、SentimentEnum に変換する"""
        if isinstance(v, str):
            return SentimentEnum(v)
        return v


class SentimentError(BaseComprehendModel):
    """BatchDetectSentiment の中のエラーを表すモデル"""

    index: int
    error_code: str
    error_message: str


class BatchDetectSentimentResponse(BaseComprehendModel):
    """AWS Comprehend による BatchDetectSentiment の結果を表すモデル"""

    result_list: list[SentimentResult]
    error_list: list[SentimentError]
