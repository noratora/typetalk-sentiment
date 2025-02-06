"""FastAPIアプリケーションを作成する機能を提供する"""

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from src.api.routers import router
from src.exceptions.exception_handlers import (
    comprehend_error_handler,
    custom_http_exception_handler,
    typetalk_error_handler,
    unexpected_exception_handler,
    validation_exception_handler,
)
from src.infrastructure.aws.comprehend.exceptions import ComprehendError
from src.infrastructure.typetalk.exceptions import TypetalkAPIError


def add_exception_handlers(app: FastAPI) -> None:
    """FastAPI アプリケーションに例外ハンドラを追加する

    Args:
        app (FastAPI): FastAPI アプリケーションインスタンス
    """
    app.add_exception_handler(TypetalkAPIError, typetalk_error_handler)
    app.add_exception_handler(ComprehendError, comprehend_error_handler)
    app.add_exception_handler(StarletteHTTPException, custom_http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unexpected_exception_handler)


def create_app() -> FastAPI:
    """FastAPI アプリケーションを作成する

    Returns:
        FastAPI: FastAPI アプリケーションインスタンス
    """
    app = FastAPI()
    app.include_router(router)
    add_exception_handlers(app)
    return app


app = create_app()
