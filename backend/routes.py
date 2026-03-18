from flask import Blueprint, request, jsonify, current_app

routes = Blueprint('routes', __name__)


def _load_analysis_service():
    if __package__:
        from . import analysis_service
    else:
        import analysis_service

    return analysis_service


@routes.route('/api/health')
def health_check():
    if __package__:
        from . import globals
    else:
        import globals

    if not globals.runtime_ready():
        return jsonify({"status": "loading"}), 503
    return jsonify({"status": "healthy"})

@routes.route("/api/analyze", methods=["POST"])
def analyze_route():
    if "file" not in request.files:
        return jsonify({"stage": "upload", "message": "No file provided"}), 400

    analysis_service = _load_analysis_service()

    try:
        payload = analysis_service.analyze_upload(
            request.files["file"],
            current_app.config["UPLOAD_FOLDER"],
        )
        return jsonify(payload)
    except analysis_service.InvalidUploadError as exc:
        return jsonify({"stage": exc.stage, "message": exc.message}), exc.status_code
    except Exception:
        current_app.logger.exception("Unexpected error during /api/analyze")
        return jsonify(
            {
                "stage": "analysis",
                "message": "Unexpected error during analysis",
            }
        ), 500
