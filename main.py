"""Academy static learning app served by the DEJ FastAPI template."""

import os
from html import escape
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import HTMLResponse, Response
from fastapi.staticfiles import StaticFiles

STATIC_DIR = Path(__file__).resolve().parent / "static"


def create_app(root_path: str | None = None) -> FastAPI:
    prefix = (os.getenv("APP_ROOT_PATH", "") if root_path is None else root_path).rstrip("/")
    if prefix and (not prefix.startswith("/") or any(c in prefix for c in "?#")):
        raise ValueError("APP_ROOT_PATH must be a URL path such as /project/name/user/proxy/8000")

    application = FastAPI(
        title="바이브코딩 라이브러리",
        root_path=prefix,
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    if prefix:
        @application.middleware("http")
        async def normalize_proxy_path(request, call_next):
            # Starlette's mounted apps need path and root_path to share the prefix,
            # even when the upstream DEJ proxy strips it before forwarding.
            path = request.scope["path"]
            if path != prefix and not path.startswith(prefix + "/"):
                request.scope["path"] = prefix + path
                request.scope["raw_path"] = prefix.encode() + request.scope.get("raw_path", path.encode())
            return await call_next(request)

    # Relative assets and hash links must retain DEJ's workspace proxy prefix.
    index = (STATIC_DIR / "index.html").read_text(encoding="utf-8")
    index = index.replace("<head>", f'<head>\n<base href="{escape(prefix + "/", quote=True)}">\n<link rel="icon" href="favicon.ico">', 1)

    @application.get("/", response_class=HTMLResponse, include_in_schema=False)
    @application.get("/index.html", response_class=HTMLResponse, include_in_schema=False)
    def home():
        return HTMLResponse(index, headers={"Cache-Control": "no-cache"})

    @application.get("/healthz")
    def health():
        return {"status": "ok"}

    @application.get("/favicon.ico", include_in_schema=False)
    def favicon():
        return Response(status_code=204)

    @application.middleware("http")
    async def font_cors(request, call_next):
        # Lab iframes are sandboxed (opaque origin), so font requests need CORS.
        response = await call_next(request)
        if "/fonts/" in request.url.path:
            response.headers["Access-Control-Allow-Origin"] = "*"
        return response

    # Mount only browser assets; never expose application/configuration files.
    for name in ("css", "js", "data", "labs", "fonts"):
        application.mount(f"/{name}", StaticFiles(directory=STATIC_DIR / name), name=name)
    return application


app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
