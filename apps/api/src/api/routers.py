"""FastAPIを使用したAPIルーティングを定義する。各ルートは、特定のエンドポイントに対するHTTPリクエストを処理する"""

from typing import Annotated

from fastapi import APIRouter, Depends, Header, Query

from src.api.dependencies import get_i_aws_comprehend_api, get_i_typetalk_api
from src.infrastructure.aws.comprehend.aws_comprehend_api import IAwsComprehendApi
from src.infrastructure.typetalk.i_typetalk_api import ITypetalkApi
from src.schemas.message import GetMessagesResponse
from src.schemas.space import GetSpacesResponse
from src.schemas.topic import GetTopicsResponse
from src.use_cases.get_messages import get_messages_use_case
from src.use_cases.get_spaces import get_spaces_use_case
from src.use_cases.get_topics import get_topics_use_case

router = APIRouter()


TypetalkApiDep = Annotated[ITypetalkApi, Depends(get_i_typetalk_api)]
AwsComprehendDep = Annotated[IAwsComprehendApi, Depends(get_i_aws_comprehend_api)]


@router.get("/healthcheck")
async def health_check() -> dict:
    """ヘルスチェックAPI"""
    return {"message": "success"}


@router.get("/spaces")
async def get_spaces(
    i_typetalk_api: TypetalkApiDep,
    x_typetalk_token: Annotated[str, Header(min_length=1)],
) -> GetSpacesResponse:
    """組織一覧取得API

    Args:
        i_typetalk_api (ITypetalkApi): Typetalk APIのインターフェース
        x_typetalk_token (Annotated[str, Header, optional): Typetalkのアクセストークン

    Returns:
        GetSpacesResponse: 組織一覧取得APIレスポンス
    """
    return get_spaces_use_case(i_typetalk_api, typetalk_token=x_typetalk_token)


@router.get("/topics")
async def get_topics(
    i_typetalk_api: TypetalkApiDep,
    x_typetalk_token: Annotated[str, Header(min_length=1)],
    space_key: Annotated[str, Query(min_length=1)],
) -> GetTopicsResponse:
    """トピック一覧取得API

    Args:
        i_typetalk_api (ITypetalkApi): Typetalk APIのインターフェース
        x_typetalk_token (Annotated[str, Header, optional): Typetalkのアクセストークン
        space_key (Annotated[str, Query, optional): 対象の組織キー

    Returns:
        GetTopicsResponse: トピック一覧取得APIレスポンス
    """
    return get_topics_use_case(
        i_typetalk_api,
        typetalk_token=x_typetalk_token,
        space_key=space_key,
    )


@router.get("/topics/{topic_id}/messages")
async def get_messages(
    i_typetalk_api: TypetalkApiDep,
    i_aws_comprehend_api: AwsComprehendDep,
    x_typetalk_token: Annotated[str, Header(min_length=1)],
    topic_id: int,
    from_id: int | None = None,
) -> GetMessagesResponse:
    """メッセージ一覧取得API

    Args:
        i_typetalk_api (ITypetalkApi): Typetalk APIのインターフェース
        i_aws_comprehend_api (IAwsComprehendApi): AWS Comprehend APIのインターフェース
        topic_id (int): 対象のトピックID
        x_typetalk_token (Annotated[str, Header, optional): Typetalkのアクセストークン
        from_id (int | None, optional): 取得するメッセージ一覧の開始ID

    Returns:
        GetMessagesResponse: メッセージ一覧取得APIレスポンス
    """
    return get_messages_use_case(
        i_typetalk_api,
        i_aws_comprehend_api,
        typetalk_token=x_typetalk_token,
        topic_id=topic_id,
        from_id=from_id,
    )
