import builtins
import importlib
import sys
import types
from pathlib import Path

import pytest


def clear_backend_modules():
    for module_name in [
        "backend.app",
        "backend.routes",
        "backend.utils",
        "backend.globals",
        "globals",
        "utils",
    ]:
        sys.modules.pop(module_name, None)


def test_package_imports_resolve_backend_modules(monkeypatch):
    clear_backend_modules()
    monkeypatch.setitem(sys.modules, "torch", types.ModuleType("torch"))

    app_module = importlib.import_module("backend.app")
    routes_module = importlib.import_module("backend.routes")

    assert app_module.globals.__name__ == "backend.globals"
    assert routes_module.__package__ == "backend"
    assert routes_module.routes.name == "routes"


def test_runtime_paths_are_anchored_to_project_root(tmp_path, monkeypatch):
    clear_backend_modules()
    monkeypatch.chdir(tmp_path)

    app_module = importlib.import_module("backend.app")
    project_root = Path(app_module.__file__).resolve().parents[1]
    expected_upload_folder = project_root / "uploads"
    expected_model_path = project_root / "backend" / "models" / "audio_cnn_20epochs_best.pth"
    expected_songs_index_path = project_root / "backend" / "csv" / "GTZANindex.txt"

    assert Path(app_module.UPLOAD_FOLDER) == expected_upload_folder
    assert Path(app_module.MODEL_PATH) == expected_model_path
    assert Path(app_module.SONGS_INDEX_PATH) == expected_songs_index_path

    app = app_module.create_app(load_models=False)

    assert Path(app.config["UPLOAD_FOLDER"]) == expected_upload_folder


def test_load_songs_data_raises_runtime_error_on_read_failure(tmp_path, monkeypatch):
    clear_backend_modules()
    app_module = importlib.import_module("backend.app")
    songs_index_path = tmp_path / "GTZANindex.txt"
    songs_index_path.write_text("rock.00001.wav ::: Artist ::: Title\n", encoding="utf-8")

    real_open = builtins.open
    real_path_open = Path.open

    def broken_open(path, *args, **kwargs):
        if Path(path) == songs_index_path:
            raise OSError("permission denied")
        return real_open(path, *args, **kwargs)

    def broken_path_open(self, *args, **kwargs):
        if Path(self) == songs_index_path:
            raise OSError("permission denied")
        return real_path_open(self, *args, **kwargs)

    monkeypatch.setattr(builtins, "open", broken_open)
    monkeypatch.setattr(Path, "open", broken_path_open)

    with pytest.raises(RuntimeError, match="Failed to read songs index"):
        app_module.load_songs_data(songs_index_path)
