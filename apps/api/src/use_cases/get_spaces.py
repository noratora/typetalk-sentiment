"""Typetalkから参加している組織の一覧を取得する機能を提供する"""

from src.core.logger.logger import logger
from src.infrastructure.typetalk.i_typetalk_api import ITypetalkApi
from src.schemas.space import GetSpacesResponse


def get_spaces_use_case(
    i_typetalk_api: ITypetalkApi,
    typetalk_token: str,
) -> GetSpacesResponse:
    """Typetalkから参加している組織の一覧を取得する

    Args:
        i_typetalk_api (ITypetalkApi): Typetalk APIのインターフェース
        typetalk_token (str): Typetalkのアクセストークン

    Returns:
        GetSpacesResponse: 組織一覧取得APIレスポンス
    """
    logger.info("START - get_spaces_use_case")

    # Typetalkにて参加している組織一覧を取得する
    typetalk_response = i_typetalk_api.get_spaces(typetalk_token)
    logger.info("Retrieved %d spaces from Typetalk", len(typetalk_response.my_spaces))

    # APIレスポンス
    my_spaces = typetalk_response.my_spaces
    response = GetSpacesResponse(spaces=[my_space.space for my_space in my_spaces])

    logger.info("END - get_spaces_use_case")

    return response
