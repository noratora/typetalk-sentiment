"""Typetalkのアカウントに関するスキーマを定義する"""

from src.schemas.core import BaseSchema


class Account(BaseSchema):
    """Typetalkのアカウントを表すスキーマ"""

    id: int
    name: str
    image_url: str
