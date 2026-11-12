import importlib.util
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

APP_DIR = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("dej_main", APP_DIR / "main.py")
main = importlib.util.module_from_spec(spec)
spec.loader.exec_module(main)


@pytest.mark.parametrize("prefix", ["", "/project/academy/test-user/proxy/8000"])
def test_index_and_all_assets(prefix):
    with TestClient(main.create_app(prefix)) as client:
        # Test both a proxy stripping its prefix and one preserving the prefix.
        for request_prefix in dict.fromkeys(["", prefix]):
            for index in ("/", "/index.html"):
                response = client.get(request_prefix + index)
                assert response.status_code == 200
                assert f'<base href="{prefix}/">' in response.text
                assert '바이브코딩 라이브러리' in response.text
                assert response.headers["cache-control"] == "no-cache"
            for file in (APP_DIR / "static").rglob("*"):
                if not file.is_file() or file.parent == APP_DIR / "static":
                    continue
                response = client.get(request_prefix + "/" + file.relative_to(APP_DIR / "static").as_posix())
                assert response.status_code == 200, str(file)
                assert response.content == file.read_bytes(), str(file)
        assert client.get("/healthz").json() == {"status": "ok"}
        assert client.get("/favicon.ico").status_code == 204


def test_content_types_and_missing_files():
    with TestClient(main.create_app("")) as client:
        for url, content_type in [
            ("/", "text/html"), ("/css/app.css", "text/css"),
            ("/js/app.js", "javascript"), ("/data/labs.js", "javascript"),
            ("/labs/101-03.html", "text/html"),
        ]:
            assert content_type in client.get(url).headers["content-type"]
        for url in ("/main.py", "/requirements.txt", "/.env", "/docs", "/unknown", "/labs/missing.html", "/js/%2e%2e/main.py", "/js/..%5cmain.py"):
            response = client.get(url)
            assert response.status_code == 404, url
            assert 'import os' not in response.text


def test_environment_prefix(monkeypatch):
    monkeypatch.setenv("APP_ROOT_PATH", "/project/name/user/proxy/8501/")
    with TestClient(main.create_app()) as client:
        assert '<base href="/project/name/user/proxy/8501/">' in client.get("/").text


@pytest.mark.parametrize("prefix", ["https://example.com", "relative/path", "/proxy?x=1", "/proxy#fragment"])
def test_invalid_prefix(prefix):
    with pytest.raises(ValueError):
        main.create_app(prefix)
