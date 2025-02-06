"""ログレコードをJSON形式にフォーマットするクラスを定義する"""

import json
from datetime import datetime
from logging import Formatter, LogRecord


class JsonFormatter(Formatter):
    """ログレコードをJSON形式にフォーマットするクラス"""

    def format(self, record: LogRecord) -> str:
        """ログレコードをJSON形式にフォーマットする

        Args:
            record (LogRecord): ログレコード

        Returns:
            str: フォーマットされたログレコードのJSON文字列
        """
        try:
            # ミリ秒を含む ISO 8601 形式
            iso_format_datetime = (
                datetime.fromtimestamp(record.created)
                .astimezone()
                .isoformat(timespec="milliseconds")
            )

            log_record = {
                "datetime": iso_format_datetime,
                "levelname": record.levelname,
                "msg": record.getMessage(),
                "pathname": record.pathname,
                "lineno": record.lineno,
                "funcName": record.funcName,
            }

            if record.exc_info:
                log_record["traceback"] = self.formatException(
                    record.exc_info,
                ).splitlines()

            return json.dumps(log_record)
        except Exception:
            return super().format(record)
