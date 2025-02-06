"""tests/unit/ 以下のテストで使用する pytest の fixture 関数を定義する"""

import os
from collections.abc import Generator

import pytest

from src.api.dependencies import get_i_typetalk_api
from src.infrastructure.aws.comprehend.aws_comprehend_api_mock import (
    AwsComprehendApiMock,
)
from src.infrastructure.typetalk.i_typetalk_api import ITypetalkApi


@pytest.fixture(autouse=True)
def setup_unit_test_settings(
    monkeypatch: pytest.MonkeyPatch,
) -> Generator[None, None, None]:
    """ユニットテスト用の設定を注入する fixture"""
    from src.core.config import get_settings

    get_settings.cache_clear()

    # 環境変数 TYPETALK_API_BASE_URL をモックサーバーのURLに上書きする
    # これにより、ユニットテスト中はすべてのAPIリクエストがモックサーバーに向けられる
    mock_url = os.getenv("MOCK_TYPETALK_API_BASE_URL")
    if mock_url:
        monkeypatch.setenv("TYPETALK_API_BASE_URL", mock_url)

    yield

    # テスト完了後、設定のキャッシュをクリアする
    get_settings.cache_clear()


@pytest.fixture
def typetalk_api() -> ITypetalkApi:
    """TypetalkApiインスタンスを提供する fixture

    Note:
        実際のリクエスト先は setup_unit_test_settings fixture で
        環境変数 TYPETALK_API_BASE_URL を通じて設定される。

    Returns:
        ITypetalkApi: TypetalkApiインスタンス
    """
    return get_i_typetalk_api()


@pytest.fixture(scope="session")
def aws_comprehend_api_mock() -> AwsComprehendApiMock:
    """AWS Comprehend APIのモックインスタンスを提供する fixture

    Returns:
        AwsComprehendApiMock: AwsComprehendApiMockのインスタンス
    """
    return AwsComprehendApiMock()
