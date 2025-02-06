"""ロガーを設定するための関数を定義する"""

import json
from logging import Logger, config, getLogger
from pathlib import Path

from src.core.config import get_settings


def configure_logger() -> Logger:
    """ログ設定ファイルから設定を読み込み、ロガーを設定する

    Returns:
        Logger: 設定済みのロガー
    """
    settings = get_settings()

    with Path(settings.log_config_file).open() as f:
        log_config = json.load(f)

    config.dictConfig(log_config)

    logger = getLogger(settings.logger_name)
    logger.setLevel(settings.log_level)

    return logger


logger = configure_logger()
