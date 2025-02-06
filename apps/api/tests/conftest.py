"""tests/ 以下のテストで使用する pytest の fixture 関数を定義する"""

import pytest

from src.infrastructure.aws.comprehend.aws_comprehend_api import AwsComprehendApi


@pytest.fixture(scope="session")
def aws_comprehend_api() -> AwsComprehendApi:
    """AwsComprehendApiのインスタンスを提供する fixture

    Returns:
        AwsComprehendApi: AwsComprehendApiのインスタンス
    """
    return AwsComprehendApi()
