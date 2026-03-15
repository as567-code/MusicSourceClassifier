import numpy as np

from backend.response_builders import build_analysis_payload
from backend.utils import describe_audio_signal


def test_build_ai_payload_contains_signals_and_limitations():
    payload = build_analysis_payload(
        filename="demo.mp3",
        verdict="ai",
        confidence=0.91,
        audio_metrics={
            "spectral_flatness": 0.42,
            "dynamic_range": 0.08,
            "zero_crossing_rate": 0.12,
        },
        similar_songs=[
            {
                "id": 1,
                "title": "Real Track",
                "artist": "Artist",
                "album": "GTZAN Dataset",
                "similarity": 83.2,
                "genre": "Rock",
            }
        ],
        matched_track=None,
    )

    assert payload["verdict"] == "ai"
    assert payload["confidence"] == 0.91
    assert payload["filename"] == "demo.mp3"
    assert payload["signals"]
    assert payload["analysisStages"] == [
        "upload received",
        "spectrogram generated",
        "classifier scored",
    ]
    assert payload["similarSongs"][0]["title"] == "Real Track"
    assert payload["matchedTrack"] is None
    assert "model prediction" in payload["limitations"][0].lower()


def test_describe_audio_signal_returns_lightweight_descriptors():
    sample_rate = 22050
    timeline = np.linspace(0, 1, sample_rate, endpoint=False)
    waveform = 0.15 * np.sin(2 * np.pi * 220 * timeline)
    waveform[sample_rate // 2 :] *= 0.5

    metrics = describe_audio_signal(waveform, sample_rate)

    assert set(metrics) == {
        "spectral_flatness",
        "zero_crossing_rate",
        "dynamic_range_db",
    }
    assert metrics["spectral_flatness"] >= 0
    assert metrics["zero_crossing_rate"] > 0
    assert metrics["dynamic_range_db"] >= 0


def test_app_fixture_creates_lightweight_flask_app(app):
    assert app.config["MODELS_LOADED"] is False

    response = app.test_client().get("/api/health")

    assert response.status_code == 200
    assert response.get_json() == {"status": "healthy"}
