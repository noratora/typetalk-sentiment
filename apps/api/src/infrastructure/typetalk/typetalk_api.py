"""Typetalk APIへのリクエストを行うクラスを定義する"""

import httpx

from src.infrastructure.typetalk.exceptions import TypetalkAPIError
from src.infrastructure.typetalk.i_typetalk_api import ITypetalkApi
from src.schemas.message import TypetalkGetMessagesResponse
from src.schemas.space import TypetalkGetSpacesResponse
from src.schemas.topic import TypetalkGetTopicsResponse


class TypetalkApi(ITypetalkApi):
    """Typetalk APIへのリクエストを行うクラス"""

    def __init__(self, base_url: str):
        """TypetalkApi クラスのインスタンスを初期化する

        Args:
            base_url (str): Typetalk API のベース URL
        """
        self.base_url = base_url

    def __get(self, url: str, headers: dict, params: dict | None = None) -> dict:
        """GETリクエストを行う

        Args:
            url (str): リクエスト先のURL
            headers (dict): リクエストヘッダー
            params (dict | None, optional): リクエストパラメータ

        Returns:
            dict: レスポンスのJSONデータ

        Raises:
            TypetalkAPIError:
                Typetalk APIからエラーレスポンスを受け取った場合に発生する。
        """
        try:
            r = httpx.get(
                url=url,
                headers=headers,
                params=params,
            )
            r.raise_for_status()

            return r.json()

        except httpx.HTTPStatusError as exc:
            raise TypetalkAPIError(
                status_code=exc.response.status_code,
                content=exc.response.json() if exc.response.content else None,
                detail=exc.args,
            ) from exc

    def get_spaces(self, typetalk_token: str) -> TypetalkGetSpacesResponse:
        """Typetalkの組織一覧を取得する

        Args:
            typetalk_token (str): Typetalkのアクセストークン

        Returns:
            TypetalkGetSpacesResponse: Typetalk組織一覧のレスポンス

        Reference:
            https://developer.nulab.com/ja/docs/typetalk/api/1/get-spaces/#
        """
        url = f"{self.base_url}/api/v1/spaces"
        headers = {"Authorization": f"Bearer {typetalk_token}"}
        query_params = {"excludesGuest": "true"}
        typetalk_response = self.__get(
            url,
            headers=headers,
            params=query_params,
        )
        return TypetalkGetSpacesResponse.model_validate(
            typetalk_response,
        )

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

        Reference:
            https://developer.nulab.com/ja/docs/typetalk/api/3/get-topics/#
        """
        url = f"{self.base_url}/api/v3/topics"
        headers = {"Authorization": f"Bearer {typetalk_token}"}
        query_params = {"isArchived": "false", "spaceKey": space_key}
        typetalk_response = self.__get(
            url=url,
            headers=headers,
            params=query_params,
        )
        return TypetalkGetTopicsResponse.model_validate(
            typetalk_response,
        )

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

        Reference:
            https://developer.nulab.com/ja/docs/typetalk/api/1/get-messages/#
        """
        url = f"{self.base_url}/api/v1/topics/{topic_id}"
        headers = {"Authorization": f"Bearer {typetalk_token}"}
        query_params = {"direction": "backward"}
        if from_id is not None:
            query_params["from"] = str(from_id)
        typetalk_response = self.__get(
            url,
            headers=headers,
            params=query_params,
        )
        return TypetalkGetMessagesResponse.model_validate(
            typetalk_response,
        )
