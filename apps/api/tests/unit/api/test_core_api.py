"""APIの基本機能に関するテストケースを定義する"""

from fastapi import status
from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app, raise_server_exceptions=False)


class TestCoreApi:
    """APIの基本機能に関するテストケースを定義する"""

    class TestHappyCases:
        """正常系のテストケース"""

        def test_when_health_check_endpoint_called_then_returns_200_ok(self) -> None:
            """ヘルスチェックが200 OKを返す"""
            # Act
            response = client.get("/healthcheck")

            # Assert
            assert response.status_code == status.HTTP_200_OK
            content = response.json()
            assert content == {"message": "success"}

    class TestUnhappyCases:
        """異常系のテストケース"""

        def test_when_nonexistent_route_accessed_then_returns_404_not_found(
            self,
        ) -> None:
            """存在しないルートへのアクセスが404 Not Foundを返す"""
            # Act
            response = client.get("/not_found")

            # Assert
            assert response.status_code == status.HTTP_404_NOT_FOUND
            content = response.json()
            assert content == {"title": "HTTP error occurred.", "detail": "Not Found"}
