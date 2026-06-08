from pathlib import Path

from flask import Flask
from flask_cors import CORS

from controller.admin_controller import admin_bp
from controller.admin_open_time_controller import admin_open_time_bp
from controller.admin_seat_controller import admin_seat_bp
from controller.admin_timeout_controller import admin_timeout_bp
from controller.auth_controller import auth_bp
from controller.health_controller import health_bp
from controller.open_time_controller import open_time_bp
from controller.reservation_controller import reservation_bp
from controller.report_controller import report_bp
from controller.seat_controller import seat_bp
from controller.study_session_controller import study_session_bp
from model import db
from utils.errors import BusinessError
from utils.response import fail


def create_app():
    app = Flask(__name__)
    db_path = Path(__file__).resolve().parent / "library.db"
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = "library-seat-management-secret"

    CORS(app)
    db.init_app(app)

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(open_time_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(seat_bp, url_prefix="/api/seats")
    app.register_blueprint(reservation_bp, url_prefix="/api/reservations")
    app.register_blueprint(study_session_bp, url_prefix="/api/study-sessions")
    app.register_blueprint(report_bp, url_prefix="/api/reports")
    app.register_blueprint(admin_seat_bp, url_prefix="/api/admin")
    app.register_blueprint(admin_open_time_bp, url_prefix="/api/admin")
    app.register_blueprint(admin_timeout_bp, url_prefix="/api/admin")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    @app.errorhandler(BusinessError)
    def handle_business_error(error):
        return fail(error.message, error.status_code)

    @app.errorhandler(404)
    def handle_not_found(error):
        return fail("API not found.", 404)

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        app.logger.exception(error)
        return fail("Internal server error.", 500)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
