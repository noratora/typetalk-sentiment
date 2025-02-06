"""tests/unit/api/ 以下のテストで使用する pytest の fixture 関数を定義する"""

from collections.abc import Generator

import pytest

from src.api.dependencies import get_i_aws_comprehend_api, get_i_typetalk_api
from src.main import app
from tests.unit.mocks.aws.comprehend.aws_comprehend_api_mock_error import (
    AwsComprehendApiMockError,
)
from tests.unit.mocks.typetalk.typetalk_api_mock_error import TypetalkApiMockError


@pytest.fixture
def setup_dependency_typetalk_api_mock_error() -> Generator[None, None, None]:
    """Typetalk TypetalkAPIエラーモックの依存関係を設定するfixture

    テスト中はTypetalk APIのエラー応答をシミュレートし、
    テスト終了後に依存関係を元の状態にリセットする。
    """
    app.dependency_overrides[get_i_typetalk_api] = lambda: TypetalkApiMockError()
    yield
    app.dependency_overrides.pop(get_i_typetalk_api)


@pytest.fixture
def setup_dependency_aws_comprehend_api_mock_error() -> Generator[None, None, None]:
    """AWS Comprehend APIエラーモックの依存関係を設定するfixture

    テスト中は実際のAWS Comprehend APIのエラー応答をシミュレートし、
    テスト終了後に依存関係を元の状態にリセットする。
    """
    # 依存関係を上書きする
    app.dependency_overrides[get_i_aws_comprehend_api] = (
        lambda: AwsComprehendApiMockError()
    )
    yield
    app.dependency_overrides.pop(get_i_aws_comprehend_api)
