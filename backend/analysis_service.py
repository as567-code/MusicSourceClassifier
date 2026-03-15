import os
from uuid import uuid4

from werkzeug.utils import secure_filename

if __package__:
    from . import globals
    from .response_builders import build_analysis_payload
else:
    import globals
    from response_builders import build_analysis_payload


class InvalidUploadError(Exception):
    def __init__(self, stage, message, status_code=400):
        super().__init__(message)
        self.stage = stage
        self.message = message
        self.status_code = status_code


def _load_utils():
    if __package__:
        from .utils import allowed_file, extract_audio_descriptors, transform_audio
    else:
        from utils import allowed_file, extract_audio_descriptors, transform_audio

    return allowed_file, extract_audio_descriptors, transform_audio


def _runtime_unavailable():
    raise InvalidUploadError(
        stage="classification",
        message="Analysis runtime is unavailable",
        status_code=503,
    )


def save_uploaded_file(file_storage, upload_folder):
    allowed_file, _, _ = _load_utils()

    if file_storage is None:
        raise InvalidUploadError("upload", "No file provided")

    filename = secure_filename(file_storage.filename or "")
    if not filename:
        raise InvalidUploadError("upload", "No file provided")

    if not allowed_file(filename):
        raise InvalidUploadError("upload", "Invalid file type")

    os.makedirs(upload_folder, exist_ok=True)
    _, extension = os.path.splitext(filename)
    temp_filename = f"{uuid4().hex}{extension}"
    filepath = os.path.join(upload_folder, temp_filename)

    try:
        file_storage.save(filepath)
    except Exception as exc:
        raise InvalidUploadError("upload", "Failed to save uploaded file", 500) from exc

    return filepath, filename


def cleanup_upload(filepath):
    if filepath and os.path.exists(filepath):
        os.remove(filepath)


def score_ai_probability(input_tensor):
    if not globals.runtime_ready():
        _runtime_unavailable()

    try:
        import torch
    except ImportError as exc:
        raise InvalidUploadError("classification", "PyTorch is unavailable", 500) from exc

    try:
        input_tensor = input_tensor.to(globals.device)
        with torch.no_grad():
            output = globals.model(input_tensor)
        return float(output.item() if hasattr(output, "item") else output)
    except Exception as exc:
        raise InvalidUploadError("classification", "Failed to score audio", 500) from exc


def lookup_song_details(filename):
    candidate_filenames = {filename, secure_filename(filename)}

    for song in globals.song_catalog():
        if song.get("filename") not in candidate_filenames:
            continue

        return {
            "id": 1,
            "filename": song.get("filename"),
            "title": song.get("title") or "Unknown Title",
            "artist": song.get("artist") or "Unknown Artist",
            "album": "GTZAN Dataset",
            "similarity": 100.0,
            "genre": song.get("genre") or "Unknown",
        }

    return None


def search_similar_songs(filepath, k=5):
    if globals.search_engine is None:
        return None

    try:
        results_df = globals.search_engine.knn_query_vector(
            globals.search_engine.embed_path(filepath),
            k=k,
        )
    except Exception:
        return None

    if results_df is None or getattr(results_df, "empty", False):
        return None

    response_data = []
    rank = 1

    for _, row in results_df.iterrows():
        song_filename = os.path.basename(row.get("path", ""))
        matched_song = next(
            (song for song in globals.song_catalog() if song.get("filename") == song_filename),
            None,
        )

        title = matched_song["title"] if matched_song else row.get("title", "Unknown Title")
        artist = matched_song["artist"] if matched_song else row.get("artist", "Unknown Artist")
        genre = matched_song["genre"] if matched_song else row.get("label", "Unknown")

        score = float(row.get("score", 0))
        similarity = max(0.0, min(100.0, round(score * 100, 3)))

        response_data.append(
            {
                "id": rank,
                "title": title,
                "artist": artist,
                "album": "GTZAN Dataset",
                "similarity": similarity,
                "genre": genre,
            }
        )
        rank += 1

    return response_data


def analyze_upload(file_storage, upload_folder):
    _, extract_audio_descriptors, transform_audio = _load_utils()
    filepath = None
    original_filename = getattr(file_storage, "filename", "") or ""

    try:
        filepath, filename = save_uploaded_file(file_storage, upload_folder)

        input_tensor = transform_audio(filepath)
        if input_tensor is None:
            raise InvalidUploadError(
                "preprocess",
                "Could not process audio file",
                422,
            )

        audio_metrics = extract_audio_descriptors(filepath)
        confidence = score_ai_probability(input_tensor)
        verdict = "human" if confidence <= 0.5 else "ai"

        similar_songs = []
        similarity_search_completed = False
        if verdict == "ai":
            search_results = search_similar_songs(filepath)
            if search_results is not None:
                similar_songs = search_results
                similarity_search_completed = True

        matched_track = lookup_song_details(original_filename) if verdict == "human" else None

        payload = build_analysis_payload(
            filename=filename,
            verdict=verdict,
            confidence=confidence,
            audio_metrics=audio_metrics,
            similar_songs=similar_songs,
            matched_track=matched_track,
        )

        if verdict == "ai" and similarity_search_completed:
            payload["analysisStages"].append("similarity search complete")

        return payload
    finally:
        cleanup_upload(filepath)
