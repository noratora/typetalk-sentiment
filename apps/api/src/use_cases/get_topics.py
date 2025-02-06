"""Typetalkから参加しているトピックの一覧を取得する機能を提供する"""

from src.core.logger.logger import logger
from src.infrastructure.typetalk.i_typetalk_api import ITypetalkApi
from src.schemas.topic import GetTopicsResponse


def get_topics_use_case(
    i_typetalk_api: ITypetalkApi,
    typetalk_token: str,
    space_key: str,
) -> GetTopicsResponse:
    """Typetalkから参加しているトピック一覧を取得する

    Args:
        i_typetalk_api (ITypetalkApi): Typetalk APIのインターフェース
        typetalk_token (str): Typetalkのアクセストークン
        space_key (str): 対象の組織キー

    Returns:
        GetTopicsResponse: トピック一覧取得APIレスポンス

    """
    logger.info("START - get_topics_use_case, space_key: %s", space_key)

    # Typetalkにて参加しているトピック一覧を取得する
    typetalk_response = i_typetalk_api.get_topics(typetalk_token, space_key)
    logger.info("Retrieved %d topics from Typetalk", len(typetalk_response.topics))

    # APIレスポンス
    my_topics = typetalk_response.topics
    response = GetTopicsResponse(topics=[my_topic.topic for my_topic in my_topics])

    logger.info("END - get_topics_use_case, space_key: %s", space_key)

    return response
