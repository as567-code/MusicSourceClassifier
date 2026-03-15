import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


@pytest.fixture
def app():
    from backend.app import create_app

    flask_app = create_app(load_models=False)
    flask_app.config.update(TESTING=True)
    return flask_app
