from flask import Blueprint

from service.open_time_config_service import get_open_time_config
from utils.response import success


open_time_bp = Blueprint("open_time", __name__)


@open_time_bp.get("/open-time-config")
def get_public_open_time_config():
    return success(get_open_time_config())
