"""Typetalk APIからのエラーレスポンスを処理する例外クラスを定義する"""

from typing import Any

from src.exceptions.exceptions import AppBaseError


class TypetalkAPIError(AppBaseError):
    """Typetalk APIからエラーレスポンスを受け取った場合に発生する例外クラス"""

    def __init__(self, status_code: int, content: dict | None, detail: tuple[Any, ...]):
        """TypetalkAPIError クラスのインスタンスを初期化する

        Args:
            status_code (int): HTTP ステータスコード
            content (dict | None): エラーレスポンスの内容
            detail (tuple[Any, ...]): エラーの詳細情報
        """
        self.status_code = status_code
        self.content = content
        super().__init__(detail)
