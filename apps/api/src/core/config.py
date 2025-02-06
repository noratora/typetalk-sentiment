"""環境設定を管理するクラスと関数を定義する"""

import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """環境設定を保持するクラス

    環境変数から設定値を読み込む。
    開発環境(APP_ENV != "production")では.envファイルからも読み込みを行うが、
    本番環境では環境変数のみを使用する。

    設定値の優先順位:
    1. OSの環境変数
    2. .envファイル(開発環境のみ)
    3. デフォルト値(設定されている場合)
    """

    # アプリケーションの環境
    app_env: str

    # ログ関連の設定
    log_config_file: str
    logger_name: str
    log_level: str

    # AWS Comprehend API設定
    use_mock_aws_comprehend_api: bool

    # Typetalk API URL
    typetalk_api_base_url: str

    # 環境設定の読み込み方法を定義
    # 本番環境(APP_ENV=production)では.envファイルを読み込まない
    model_config = SettingsConfigDict(
        env_file=".env" if os.getenv("APP_ENV") != "production" else None,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """環境設定のシングルトンインスタンスを取得する

    @lru_cache デコレータにより、設定は一度だけ読み込まれ、
    以降はキャッシュされた値が返される。

    Returns:
        Settings: 環境設定を保持するSettingsクラスのインスタンス
    """
    return Settings()
