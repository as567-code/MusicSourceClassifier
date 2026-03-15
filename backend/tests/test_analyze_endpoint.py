import importlib
import io
import sys
import types


class StubInvalidUploadError(Exception):
    def __init__(self, stage, message, status_code=400):
        super().__init__(message)
        self.stage = stage
        self.message = message
        self.status_code = status_code


def clear_backend_modules():
    for module_name in [
        "backend.app",
        "backend.routes",
        "backend.analysis_service",
        "analysis_service",
        "routes",
    ]:
        sys.modules.pop(module_name, None)

    backend_package = sys.modules.get("backend")
    if backend_package is not None:
        for attribute in ("app", "routes", "analysis_service"):
            if hasattr(backend_package, attribute):
                delattr(backend_package, attribute)


def build_test_client():
    app_module = importlib.import_module("backend.app")
    flask_app = app_module.create_app(load_models=False)
    flask_app.config.update(TESTING=True)
    return flask_app.test_client()


def install_stub_analysis_service(monkeypatch, payload):
    stub_module = types.ModuleType("backend.analysis_service")

    stub_module.InvalidUploadError = StubInvalidUploadError

    def analyze_upload(*_args, **_kwargs):
        if isinstance(payload, Exception):
            raise payload
        return payload

    stub_module.analyze_upload = analyze_upload
    monkeypatch.setitem(sys.modules, "backend.analysis_service", stub_module)
    monkeypatch.setitem(sys.modules, "analysis_service", stub_module)
    monkeypatch.setattr(importlib.import_module("backend"), "analysis_service", stub_module, raising=False)


def test_analyze_endpoint_returns_ai_payload(monkeypatch):
    clear_backend_modules()
    expected = {
        "verdict": "ai",
        "confidence": 0.88,
        "filename": "demo.mp3",
        "explanation": "The model detected patterns often associated with AI-generated music.",
        "signals": ["high repetition"],
        "analysisStages": [
            "upload received",
            "classifier scored",
            "similarity search complete",
        ],
        "similarSongs": [],
        "matchedTrack": None,
        "limitations": ["This is a model prediction, not definitive proof."],
    }
    install_stub_analysis_service(monkeypatch, expected)
    client = build_test_client()

    response = client.post(
        "/api/analyze",
        data={"file": (io.BytesIO(b"demo"), "demo.mp3")},
        content_type="multipart/form-data",
    )

    assert response.status_code == 200
    assert response.get_json() == expected


def test_analyze_endpoint_requires_file():
    clear_backend_modules()
    client = build_test_client()

    response = client.post("/api/analyze", data={}, content_type="multipart/form-data")

    assert response.status_code == 400
    assert response.get_json() == {
        "stage": "upload",
        "message": "No file provided",
    }


def test_analyze_endpoint_returns_structured_invalid_upload_error(monkeypatch):
    clear_backend_modules()
    install_stub_analysis_service(
        monkeypatch,
        StubInvalidUploadError("preprocess", "Could not process audio file", 422),
    )
    client = build_test_client()

    response = client.post(
        "/api/analyze",
        data={"file": (io.BytesIO(b"demo"), "demo.mp3")},
        content_type="multipart/form-data",
    )

    assert response.status_code == 422
    assert response.get_json() == {
        "stage": "preprocess",
        "message": "Could not process audio file",
    }
