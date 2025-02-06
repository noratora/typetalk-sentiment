"""Typetalk APIのインターフェースを定義する抽象基底クラスを提供する"""

from abc import ABC, abstractmethod

from src.schemas.message import TypetalkGetMessagesResponse
from src.schemas.space import TypetalkGetSpacesResponse
from src.schemas.topic import TypetalkGetTopicsResponse


class ITypetalkApi(ABC):
    """Typetalk APIのインターフェースを定義する抽象基底クラス"""

    @abstractmethod
    def get_spaces(self, typetalk_token: str) -> TypetalkGetSpacesResponse:
        """Typetalkの組織一覧を取得する

        Args:
            typetalk_token (str): Typetalkのアクセストークン

        Returns:
            TypetalkGetSpacesResponse: Typetalk組織一覧のレスポンス
        """

    @abstractmethod
    def get_topics(
        self,
        typetalk_token: str,
        space_key: str,
    ) -> TypetalkGetTopicsResponse:
        """Typetalkの指定の組織からトピック一覧を取得する

        Args:
            typetalk_token (str): Typetalkのアクセストークン
            space_key (str): 対象の組織キー

        Returns:
            TypetalkGetTopicsResponse: Typetalkトピック一覧のレスポンス
        """

    @abstractmethod
    def get_messages(
        self,
        typetalk_token: str,
        topic_id: int,
        from_id: int | None = None,
    ) -> TypetalkGetMessagesResponse:
        """Typetalkの指定のトピックからメッセージ一覧を取得する

        Args:
            typetalk_token (str): Typetalkのアクセストークン
            topic_id (int): 対象のトピックID
            from_id (int | None, optional): 取得するメッセージ一覧の開始ID

        Returns:
            TypetalkGetMessagesResponse: Typetalkメッセージ一覧のレスポンス
        """
