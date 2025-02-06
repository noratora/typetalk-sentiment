"""Typetalkからメッセージ一覧を取得し、感情分析を行う機能を提供する"""

import copy
from itertools import chain

from src.core.logger.logger import logger
from src.infrastructure.aws.comprehend.aws_comprehend_api import IAwsComprehendApi
from src.infrastructure.typetalk.i_typetalk_api import ITypetalkApi
from src.schemas.message import GetMessagesResponse, Post, TypetalkGetMessagesResponse


def _get_typetalk_messages(
    i_typetalk_api: ITypetalkApi,
    typetalk_token: str,
    topic_id: int,
    from_id: int | None = None,
) -> TypetalkGetMessagesResponse:
    """Typetalkから特定のトピックのメッセージ一覧を取得する

    Args:
        i_typetalk_api (ITypetalkApi): Typetalk APIのインスタンス
        typetalk_token (str): Typetalkのアクセストークン
        topic_id (int): 対象のトピックID
        from_id (int | None, optional): 取得するメッセージ一覧の開始ID

    Returns:
        TypetalkGetMessagesResponse: Typetalkメッセージ一覧のレスポンス
    """
    return i_typetalk_api.get_messages(typetalk_token, topic_id, from_id)


def _analyze_post_messages(
    i_aws_comprehend_api: IAwsComprehendApi,
    detect_target_post_messages: list[Post],
) -> list[Post]:
    """メッセージの感情分析を行い、分析結果を含む新しいポストのリストを返す

    Args:
        i_aws_comprehend_api (IAwsComprehendApi): AWS Comprehend APIのインターフェース
        detect_target_post_messages (list[Post]): 感情分析を行うポストのリスト

    Returns:
        list[Post]: 感情分析結果を含むポストのリスト
    """
    # 対象ポストの感情分析を実行する
    batch_detect_sentiment_result = i_aws_comprehend_api.batch_detect_sentiment(
        [x.message for x in detect_target_post_messages],
    )

    # 分析対象ポストに感情分析結果を設定する
    return [
        Post(
            id=post.id,
            message=post.message,
            updated_at=post.updated_at,
            account=post.account,
            sentiment=sentiment_result.sentiment.value,
        )
        for post, sentiment_result in zip(
            detect_target_post_messages,
            batch_detect_sentiment_result.result_list,
            strict=False,
        )
    ]


def _set_sentiment_to_posts(
    posts: list[Post],
    sentiment_posts: list[Post],
) -> list[Post]:
    """Typetalkのポストと感情分析結果をマージする

    Typetalkのポストとそれらのメッセージに対する感情分析結果をマージする。
    同じIDを持つポストは、感情分析結果を持つポストで上書きされる。

    Args:
        posts (list[Post]): Typetalkから取得したポストのリスト
        sentiment_posts (list[Post]): 感情分析結果を持つポストのリスト

    Returns:
        list[Post]: マージされたポストのリスト
    """
    return list(
        {post.id: post for post in chain(posts, sentiment_posts)}.values(),
    )


def get_messages_use_case(
    i_typetalk_api: ITypetalkApi,
    i_aws_comprehend_api: IAwsComprehendApi,
    typetalk_token: str,
    topic_id: int,
    from_id: int | None = None,
) -> GetMessagesResponse:
    """Typetalkからメッセージを取得し、AWS Comprehendで感情分析を行う

    添付ファイルのみなど、メッセージ本文が空のポストは感情分析の対象から除外する。

    Args:
        i_typetalk_api (ITypetalkApi): Typetalk APIのインターフェース
        i_aws_comprehend_api (IAwsComprehendApi): AWS Comprehend APIのインターフェース
        typetalk_token (str): Typetalkのアクセストークン
        topic_id (int): 対象のトピックID
        from_id (int | None, optional): 取得するメッセージ一覧の開始ID

    Returns:
        GetMessagesResponse: メッセージ一覧取得APIレスポンス
    """
    logger.info("START - get_messages_use_case, topic_id: %s", topic_id)

    # Typetalkにて対象トピックのメッセージ一覧を取得する
    typetalk_response = _get_typetalk_messages(
        i_typetalk_api,
        typetalk_token,
        topic_id,
        from_id,
    )
    logger.info("Retrieved %d posts from Typetalk", len(typetalk_response.posts))
    logger.info("posts.has_next is : %s", typetalk_response.has_next)

    typetalk_posts = copy.deepcopy(typetalk_response.posts)

    # 分析対象ポスト
    detect_target_post_messages = [x for x in typetalk_posts if x.message]

    if detect_target_post_messages:
        # 分析対象ポストが有りの場合は感情分析を実行する
        batch_detect_sentiment_result = _analyze_post_messages(
            i_aws_comprehend_api,
            detect_target_post_messages,
        )
        logger.info(
            "Performed sentiment analysis on %d posts",
            len(batch_detect_sentiment_result),
        )
        posts_with_sentiment = _set_sentiment_to_posts(
            typetalk_posts,
            batch_detect_sentiment_result,
        )
    else:
        # 分析対象ポストが無しの場合は分析結果無しで返す
        posts_with_sentiment = typetalk_posts
        logger.info("No posts to perform sentiment analysis")

    # id の降順に並べ替えて返す
    result_posts = list(reversed(posts_with_sentiment))

    # APIレスポンス
    response = GetMessagesResponse(
        topic=typetalk_response.topic,
        has_next=typetalk_response.has_next,
        posts=result_posts,
    )

    logger.info("END - get_messages_use_case, topic_id: %s", topic_id)

    return response
