import librosa
import numpy as np

ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'flac'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def describe_audio_signal(waveform, sample_rate):
    samples = np.asarray(waveform, dtype=np.float32)
    if samples.ndim > 1:
        samples = librosa.to_mono(samples)

    if samples.size == 0:
        return {
            "spectral_flatness": 0.0,
            "zero_crossing_rate": 0.0,
            "dynamic_range_db": 0.0,
        }

    spectral_flatness = float(np.mean(librosa.feature.spectral_flatness(y=samples)))
    zero_crossing_rate = float(np.mean(librosa.feature.zero_crossing_rate(y=samples)))

    rms = librosa.feature.rms(y=samples)[0]
    rms_db = librosa.amplitude_to_db(np.maximum(rms, 1e-10), ref=np.max)
    dynamic_range_db = 0.0
    if rms_db.size:
        dynamic_range_db = float(
            max(0.0, np.percentile(rms_db, 95) - np.percentile(rms_db, 5))
        )

    return {
        "spectral_flatness": spectral_flatness,
        "zero_crossing_rate": zero_crossing_rate,
        "dynamic_range_db": dynamic_range_db,
    }


def extract_audio_descriptors(file_path, target_sample_rate=22050):
    try:
        waveform, sample_rate = librosa.load(
            file_path,
            sr=target_sample_rate,
            mono=True,
        )
    except Exception as e:
        print(f"Error loading audio descriptors: {e}")
        return {}

    return describe_audio_signal(waveform, sample_rate)

def transform_audio(file_path, target_sample_rate=22050, max_ms=4000):
    try:
        waveform, sr = librosa.load(file_path, sr=target_sample_rate)
    except Exception as e:
        print(f"Error loading audio: {e}")
        return None

    try:
        import torch
        import torch.nn.functional as F
        import torchaudio
    except ImportError as e:
        print(f"Error importing audio transform dependencies: {e}")
        return None

    waveform_tensor = torch.from_numpy(waveform).unsqueeze(0)

    max_len = int(target_sample_rate * max_ms / 1000)
    if waveform_tensor.shape[1] > max_len:
        waveform_tensor = waveform_tensor[:, :max_len]
    else:
        padding = max_len - waveform_tensor.shape[1]
        waveform_tensor = F.pad(waveform_tensor, (0, padding))

    mel_transform = torchaudio.transforms.MelSpectrogram(
        sample_rate=target_sample_rate,
        n_mels=64
    )
    spec = mel_transform(waveform_tensor)
    spec = torchaudio.transforms.AmplitudeToDB()(spec)

    return spec.unsqueeze(0)
