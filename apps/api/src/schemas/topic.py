"""Typetalkのトピックに関するスキーマを定義する"""

from src.schemas.core import BaseSchema


class Topic(BaseSchema):
    """Typetalkのトピックを表すスキーマ"""

    id: int
    name: str
    description: str | None = None


class MyTopic(BaseSchema):
    """Typetalkトピック一覧のレスポンスを構成するスキーマ"""

    topic: Topic


class TypetalkGetTopicsResponse(BaseSchema):
    """Typetalkトピック一覧のレスポンス"""

    topics: list[MyTopic]


class GetTopicsResponse(BaseSchema):
    """トピック一覧取得APIレスポンス"""

    topics: list[Topic]
