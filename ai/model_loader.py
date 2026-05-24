import os

from ultralytics import YOLO

DEFAULT_MODEL_NAME = "yolov8n.pt"

_model_instance = None


def resolve_model_path(model_path=None):
    """Resolve YOLO model file path from explicit path or common locations."""
    if model_path and os.path.exists(model_path):
        return os.path.abspath(model_path)

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    candidates = [
        os.path.join(project_root, "backend", DEFAULT_MODEL_NAME),
        os.path.join(project_root, "ai", "models", DEFAULT_MODEL_NAME),
        os.path.join(project_root, DEFAULT_MODEL_NAME),
        DEFAULT_MODEL_NAME,
    ]

    for path in candidates:
        if os.path.exists(path):
            return os.path.abspath(path)

    return DEFAULT_MODEL_NAME


def load_yolo_model(model_path=None, force_reload=False):
    """Load and cache a YOLO model instance."""
    global _model_instance

    if _model_instance is not None and not force_reload:
        return _model_instance

    resolved = resolve_model_path(model_path)
    _model_instance = YOLO(resolved)
    return _model_instance


def get_model():
    """Return cached model, loading default if needed."""
    return load_yolo_model()
