"""Typetalkのメッセージに関するスキーマを定義する"""

from src.schemas.account import Account
from src.schemas.core import BaseSchema
from src.schemas.topic import Topic


class Post(BaseSchema):
    """Typetalkのポストを表すスキーマ"""

    id: int
    message: str
    updated_at: str
    account: Account
    sentiment: str | None = None


class TypetalkGetMessagesResponse(BaseSchema):
    """Typetalkメッセージ一覧のレスポンス"""

    topic: Topic
    has_next: bool
    posts: list[Post]


class GetMessagesResponse(BaseSchema):
    """メッセージ一覧取得APIレスポンス"""

    topic: Topic
    has_next: bool
    posts: list[Post]
