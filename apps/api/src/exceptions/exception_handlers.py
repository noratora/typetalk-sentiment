"""例外ハンドラーを定義する"""

from fastapi import HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from src.core.logger.logger import logger
from src.infrastructure.aws.comprehend.exceptions import ComprehendError
from src.infrastructure.typetalk.exceptions import TypetalkAPIError


async def typetalk_error_handler(
    request: Request,
    exc: TypetalkAPIError,
) -> Response:
    """Typetalk API で発生したエラーをキャッチするハンドラー

    Args:
        request (Request): FastAPIのリクエストオブジェクト
        exc (TypetalkAPIError): キャッチされた例外

    Returns:
        JSONResponse: エラーレスポンス
    """
    logger.exception("Typetalk API request failed.: %s", exc)

    content = {"title": "Typetalk API request failed."}
    if exc.content and exc.content["error"]:
        content["detail"] = exc.content["error"]

    return JSONResponse(
        status_code=exc.status_code,
        content=content,
    )


async def comprehend_error_handler(
    request: Request,
    exc: ComprehendError,
) -> Response:
    """AWS Comprehend APIで発生したエラーをキャッチするハンドラー

    Args:
        request (Request): FastAPIのリクエストオブジェクト
        exc (ComprehendError): キャッチされた例外

    Returns:
        JSONResponse: エラーレスポンス
    """
    logger.exception("AWS Comprehend API error occurred.: %s", exc)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "title": "AWS Comprehend API error occurred.",
            "detail": str(exc),
        },
    )


async def custom_http_exception_handler(
    request: Request,
    exc: HTTPException,
) -> Response:
    """HTTPエラーをキャッチするハンドラー

    Args:
        request (Request): FastAPIのリクエストオブジェクト
        exc (HTTPException): キャッチされた例外

    Returns:
        Response: エラーレスポンス
    """
    logger.exception("HTTP error occurred.: %s", exc.detail)

    return JSONResponse(
        content={"title": "HTTP error occurred.", "detail": exc.detail},
        status_code=exc.status_code,
        headers=exc.headers,
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """バリデーションエラーをキャッチするハンドラー

    Args:
        request (Request): FastAPIのリクエストオブジェクト
        exc (RequestValidationError): キャッチされた例外

    Returns:
        JSONResponse: エラーレスポンス
    """
    logger.warning("Validation error occurred.: %s", exc)

    errors = [
        {"name": error["loc"][1], "reason": error["msg"]} for error in exc.errors()
    ]

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "title": "Validation error occurred.",
            "errors": errors,
        },
    )


async def unexpected_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    """想定外のエラーをキャッチするハンドラー

    Args:
        request (Request): FastAPIのリクエストオブジェクト
        exc (Exception): キャッチされた例外

    Returns:
        JSONResponse: エラーレスポンス
    """
    logger.exception("Unexpected error occurred.: %s", exc)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"title": "A system error has occurred."},
    )
