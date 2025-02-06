"""アプリケーションの依存関係を管理する"""

from src.core.config import get_settings
from src.infrastructure.aws.comprehend.aws_comprehend_api import AwsComprehendApi
from src.infrastructure.aws.comprehend.aws_comprehend_api_mock import (
    AwsComprehendApiMock,
)
from src.infrastructure.aws.comprehend.i_aws_comprehend_api import IAwsComprehendApi
from src.infrastructure.typetalk.i_typetalk_api import ITypetalkApi
from src.infrastructure.typetalk.typetalk_api import TypetalkApi


def get_i_typetalk_api() -> ITypetalkApi:
    """ITypetalkApiを実装したクラスのインスタンスを返す

    Returns:
        ITypetalkApi: ITypetalkApiを実装したクラスのインスタンス
    """
    base_url = get_settings().typetalk_api_base_url
    return TypetalkApi(base_url)


def get_i_aws_comprehend_api() -> IAwsComprehendApi:
    """IAwsComprehendApiを実装したクラスのインスタンスを返す

    環境設定により、モックAPIを使用するかどうかを切り替える

    Returns:
        IAwsComprehendApi: IAwsComprehendApiを実装したクラスのインスタンス
    """
    api_mapping = {
        True: AwsComprehendApiMock,
        False: AwsComprehendApi,
    }
    settings = get_settings()
    api_class = api_mapping[settings.use_mock_aws_comprehend_api]
    return api_class()
