from flask import Blueprint

from service.study_session_service import check_timeouts
from utils.auth import admin_required
from utils.response import success


admin_timeout_bp = Blueprint("admin_timeout", __name__)


@admin_timeout_bp.post("/check-timeouts")
@admin_required
def check_system_timeouts():
    return success(check_timeouts(), "Timeout check completed.")
