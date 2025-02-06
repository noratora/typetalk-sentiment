"""スキーマの基底クラスを定義する"""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class BaseSchema(BaseModel):
    """スキーマの基底クラス

    JSONのプロパティ名をキャメルケースで扱う
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        strict=True,
    )
