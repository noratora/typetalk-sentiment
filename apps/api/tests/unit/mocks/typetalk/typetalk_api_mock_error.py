"""Typetalk APIのモックを定義するクラスを提供する"""

from src.infrastructure.typetalk.i_typetalk_api import ITypetalkApi
from src.schemas.message import TypetalkGetMessagesResponse
from src.schemas.space import TypetalkGetSpacesResponse
from src.schemas.topic import TypetalkGetTopicsResponse


class TypetalkApiMockError(ITypetalkApi):
    """テスト目的のための ITypetalkApi インターフェースのモック実装クラス

    各メソッドは常に例外を発生させます。

    Note:
        本クラスは、テスト目的のためのモック実装である。本番環境では使用しないこと。
    """

    def get_spaces(self, typetalk_token: str) -> TypetalkGetSpacesResponse:
        """Typetalkの組織一覧を取得する

        このメソッドは常に例外を発生させます。

        Args:
            typetalk_token (str): Typetalkのアクセストークン

        Raises:
            Exception: 予期せぬエラー

        Returns:
            TypetalkGetSpacesResponse: Typetalk組織一覧のレスポンス
        """
        raise Exception("Unexpected error occurred at TypetalkApiMock get_spaces")

    def get_topics(
        self,
        typetalk_token: str,
        space_key: str,
    ) -> TypetalkGetTopicsResponse:
        """Typetalkの指定の組織からトピック一覧を取得する

        このメソッドは常に例外を発生させます。

        Args:
            typetalk_token (str): Typetalkのアクセストークン
            space_key (str): 対象の組織キー

        Raises:
            Exception: 予期せぬエラー

        Returns:
            TypetalkGetTopicsResponse: Typetalkトピック一覧のレスポンス
        """
        raise Exception("Unexpected error occurred at TypetalkApiMock get_topics")

    def get_messages(
        self,
        typetalk_token: str,
        topic_id: int,
        from_id: int | None = None,
    ) -> TypetalkGetMessagesResponse:
        """Typetalkの指定のトピックからメッセージ一覧を取得する

        このメソッドは常に例外を発生させます。

        Args:
            typetalk_token (str): Typetalkのアクセストークン
            topic_id (int): 対象のトピックID
            from_id (int | None, optional): 取得するメッセージ一覧の開始ID

        Raises:
            Exception: 予期せぬエラー

        Returns:
            TypetalkGetMessagesResponse: Typetalkメッセージ一覧のレスポンス
        """
        raise Exception("Unexpected error occurred at TypetalkApiMock get_messages")
