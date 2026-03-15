import os
from pathlib import Path

from flask import Flask
from flask_cors import CORS

if __package__:
    from . import globals
else:
    import globals

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
UPLOAD_FOLDER = PROJECT_ROOT / "uploads"
MODEL_PATH = BACKEND_DIR / "models" / "audio_cnn_20epochs_best.pth"
SONGS_INDEX_PATH = BACKEND_DIR / "csv" / "GTZANindex.txt"

def load_songs_data(path):
    songs = []
    songs_path = Path(path)
    if not songs_path.exists():
        return songs
    try:
        with songs_path.open('r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                parts = line.split(' ::: ')
                if len(parts) >= 3:
                    filename = parts[0]
                    artist = parts[1]
                    title = parts[2]
                    genre = filename.split('.')[0].capitalize()
                    songs.append({'filename': filename, 'artist': artist, 'title': title, 'genre': genre})
    except (OSError, UnicodeError) as exc:
        raise RuntimeError(f"Failed to read songs index: {songs_path}") from exc
    return songs

def bootstrap_runtime(model_path=MODEL_PATH, songs_index_path=SONGS_INDEX_PATH):
    if __package__:
        from .cnn_model import load_model
        from .audio_search import get_search_engine
    else:
        from cnn_model import load_model
        from audio_search import get_search_engine

    if not globals.runtime_ready():
        globals.model, globals.device = load_model(str(model_path))

    if globals.search_engine is None:
        globals.search_engine = get_search_engine()

    if not globals.song_catalog():
        globals.all_songs = load_songs_data(songs_index_path)


def register_runtime_routes(app):
    if __package__:
        from .routes import routes
    else:
        from routes import routes

    if routes.name not in app.blueprints:
        app.register_blueprint(routes)


def create_app(load_models=True):
    app = Flask(__name__)
    CORS(app)

    app.config['UPLOAD_FOLDER'] = str(UPLOAD_FOLDER)
    app.config['MODELS_LOADED'] = False
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    register_runtime_routes(app)

    if load_models:
        bootstrap_runtime()
        app.config['MODELS_LOADED'] = True

    return app


def run():
    app = create_app(load_models=True)
    app.run(debug=True, port=8000, use_reloader=False)

if __name__ == '__main__':
    run()
