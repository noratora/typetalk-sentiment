"""Typetalkの組織に関するスキーマを定義する"""

from src.schemas.core import BaseSchema


class Space(BaseSchema):
    """Typetalkの組織を表すスキーマ"""

    key: str
    name: str
    image_url: str


class MySpace(BaseSchema):
    """Typetalk組織一覧のレスポンスを構成するスキーマ"""

    space: Space


class TypetalkGetSpacesResponse(BaseSchema):
    """Typetalk組織一覧のレスポンス"""

    my_spaces: list[MySpace]


class GetSpacesResponse(BaseSchema):
    """組織一覧取得APIレスポンス"""

    spaces: list[Space]
