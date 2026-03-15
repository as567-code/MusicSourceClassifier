# Global state holder to avoid circular imports and heavy eager bootstrapping.
model = None
device = None
search_engine = None
all_songs = []


def runtime_ready():
    return model is not None and device is not None


def song_catalog():
    return all_songs or []

