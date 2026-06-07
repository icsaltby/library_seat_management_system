from flask import Blueprint, request

from service.open_time_config_service import get_open_time_config, update_open_time_config
from utils.auth import admin_required
from utils.response import success


admin_open_time_bp = Blueprint("admin_open_time", __name__)


@admin_open_time_bp.get("/open-time-config")
@admin_required
def get_config():
    return success(get_open_time_config())


@admin_open_time_bp.put("/open-time-config")
@admin_required
def update_config():
    config = update_open_time_config(request.get_json(silent=True) or {})
    return success(config, "Open time config saved successfully.")
