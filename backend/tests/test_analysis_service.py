import io

from werkzeug.datastructures import FileStorage

from backend import analysis_service, globals


def build_upload(filename, payload=b"demo"):
    return FileStorage(stream=io.BytesIO(payload), filename=filename)


def test_save_uploaded_file_uses_unique_path_for_same_original_filename(tmp_path):
    first_upload = build_upload("demo.mp3", b"first")
    second_upload = build_upload("demo.mp3", b"second")

    first_path, first_filename = analysis_service.save_uploaded_file(first_upload, tmp_path)
    second_path, second_filename = analysis_service.save_uploaded_file(second_upload, tmp_path)

    try:
        assert first_path != second_path
        assert first_filename == "demo.mp3"
        assert second_filename == "demo.mp3"
    finally:
        analysis_service.cleanup_upload(first_path)
        analysis_service.cleanup_upload(second_path)


def test_search_similar_songs_returns_none_when_index_is_empty(monkeypatch):
    class EmptyResults:
        empty = True

        def iterrows(self):
            return iter(())

    class EmptySearchEngine:
        def embed_path(self, path):
            return "query-vector"

        def knn_query_vector(self, q_vec, k=5):
            return EmptyResults()

    monkeypatch.setattr(globals, "search_engine", EmptySearchEngine())

    assert analysis_service.search_similar_songs("/tmp/demo.wav") is None


def test_lookup_song_details_returns_full_similar_song_shape(monkeypatch):
    monkeypatch.setattr(
        globals,
        "all_songs",
        [
            {
                "filename": "human-demo.wav",
                "title": "Human Demo",
                "artist": "MusicSourceClassifier Catalog",
                "genre": "Soul",
            }
        ],
    )

    details = analysis_service.lookup_song_details("human-demo.wav")

    assert details == {
        "id": 1,
        "filename": "human-demo.wav",
        "title": "Human Demo",
        "artist": "MusicSourceClassifier Catalog",
        "album": "GTZAN Dataset",
        "similarity": 100.0,
        "genre": "Soul",
    }
