from datetime import datetime

from dao.open_time_config_dao import find_open_time_config
from model import db
from utils.errors import BusinessError


def parse_hhmm(value, field_name):
    if not value:
        raise BusinessError(f"{field_name} is required.")
    try:
        return datetime.strptime(value, "%H:%M").time()
    except ValueError as exc:
        raise BusinessError(f"{field_name} must use HH:mm format.") from exc


def format_hhmm(value):
    return value.strftime("%H:%M")


def _config_to_dict(config):
    return {
        "id": config.id,
        "open_time": format_hhmm(config.open_time),
        "close_time": format_hhmm(config.close_time),
        "reserve_start_time": format_hhmm(config.reserve_start_time),
        "reserve_end_time": format_hhmm(config.reserve_end_time),
        "sign_limit": config.sign_limit,
        "leave_limit": config.leave_limit,
    }


def get_open_time_config():
    return _config_to_dict(find_open_time_config())


def update_open_time_config(data):
    config = find_open_time_config()

    open_time = parse_hhmm(data.get("open_time"), "open_time")
    close_time = parse_hhmm(data.get("close_time"), "close_time")
    reserve_start_time = parse_hhmm(data.get("reserve_start_time"), "reserve_start_time")
    reserve_end_time = parse_hhmm(data.get("reserve_end_time"), "reserve_end_time")
    sign_limit = data.get("sign_limit")
    leave_limit = data.get("leave_limit")

    if open_time >= close_time:
        raise BusinessError("open_time must be earlier than close_time.")
    if reserve_start_time >= reserve_end_time:
        raise BusinessError("reserve_start_time must be earlier than reserve_end_time.")
    if sign_limit is None or int(sign_limit) <= 0:
        raise BusinessError("sign_limit must be greater than 0.")
    if leave_limit is None or int(leave_limit) <= 0:
        raise BusinessError("leave_limit must be greater than 0.")

    config.open_time = open_time
    config.close_time = close_time
    config.reserve_start_time = reserve_start_time
    config.reserve_end_time = reserve_end_time
    config.sign_limit = int(sign_limit)
    config.leave_limit = int(leave_limit)
    db.session.commit()
    return _config_to_dict(config)
