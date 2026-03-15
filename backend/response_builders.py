ANALYSIS_STAGES = [
    "upload received",
    "spectrogram generated",
    "classifier scored",
]

BASE_LIMITATIONS = [
    "This is a model prediction, not definitive proof.",
    "Audio descriptors provide supporting context, not conclusive evidence on their own.",
]


def _clamp_confidence(confidence):
    try:
        numeric_confidence = float(confidence)
    except (TypeError, ValueError):
        return 0.0

    if numeric_confidence < 0:
        return 0.0
    if numeric_confidence > 1:
        return 1.0
    return numeric_confidence


def _get_metric(audio_metrics, *names):
    if not isinstance(audio_metrics, dict):
        return None

    for name in names:
        value = audio_metrics.get(name)
        if value is None:
            continue
        try:
            return float(value)
        except (TypeError, ValueError):
            continue

    return None


def build_signal_tags(verdict, confidence, audio_metrics):
    signals = []
    normalized_confidence = _clamp_confidence(confidence)
    spectral_flatness = _get_metric(audio_metrics, "spectral_flatness")
    zero_crossing_rate = _get_metric(audio_metrics, "zero_crossing_rate")
    dynamic_range = _get_metric(audio_metrics, "dynamic_range_db", "dynamic_range")

    if normalized_confidence >= 0.85:
        signals.append("high model confidence")
    elif normalized_confidence >= 0.65:
        signals.append("moderate model confidence")
    else:
        signals.append("borderline model confidence")

    if spectral_flatness is not None and spectral_flatness >= 0.35:
        signals.append("elevated spectral flatness")

    if zero_crossing_rate is not None and zero_crossing_rate >= 0.1:
        signals.append("elevated zero-crossing rate")

    if dynamic_range is not None:
        if dynamic_range <= 0.1:
            signals.append("limited dynamic range")
        elif dynamic_range <= 6:
            signals.append("compressed dynamics")

    if verdict == "human" and "high model confidence" in signals:
        signals[signals.index("high model confidence")] = "high human-leaning confidence"

    return signals


def build_explanation(verdict, confidence, audio_metrics):
    normalized_confidence = _clamp_confidence(confidence)
    confidence_descriptor = "higher" if normalized_confidence >= 0.8 else "moderate"

    spectral_flatness = _get_metric(audio_metrics, "spectral_flatness")
    zero_crossing_rate = _get_metric(audio_metrics, "zero_crossing_rate")
    dynamic_range = _get_metric(audio_metrics, "dynamic_range_db", "dynamic_range")

    descriptor_notes = []
    if spectral_flatness is not None and spectral_flatness >= 0.35:
        descriptor_notes.append("a flatter spectral profile")
    if zero_crossing_rate is not None and zero_crossing_rate >= 0.1:
        descriptor_notes.append("frequent waveform crossings")
    if dynamic_range is not None and dynamic_range <= 6:
        descriptor_notes.append("tighter dynamics")

    if verdict == "ai":
        base_message = (
            f"The classifier leaned toward AI-generated audio with {confidence_descriptor} confidence."
        )
    else:
        base_message = (
            f"The classifier leaned toward human-made audio with {confidence_descriptor} confidence."
        )

    if descriptor_notes:
        joined_notes = ", ".join(descriptor_notes)
        return (
            f"{base_message} Supporting signals included {joined_notes}, "
            "but these cues are only suggestive."
        )

    return (
        f"{base_message} The supporting audio descriptors were mixed, so the result should be treated cautiously."
    )


def build_analysis_payload(
    filename,
    verdict,
    confidence,
    audio_metrics,
    similar_songs,
    matched_track,
):
    normalized_confidence = _clamp_confidence(confidence)
    signals = build_signal_tags(verdict, normalized_confidence, audio_metrics)
    explanation = build_explanation(verdict, normalized_confidence, audio_metrics)

    return {
        "verdict": verdict,
        "confidence": normalized_confidence,
        "filename": filename,
        "explanation": explanation,
        "signals": signals,
        "analysisStages": ANALYSIS_STAGES.copy(),
        "similarSongs": list(similar_songs or []),
        "matchedTrack": matched_track,
        "limitations": BASE_LIMITATIONS.copy(),
    }
