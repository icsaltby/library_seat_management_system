from datetime import datetime, timedelta

from dao.reservation_dao import find_effective_reservations_by_seat_and_date
from dao.seat_dao import find_seat_by_id, get_all_seat_models
from dao.open_time_config_dao import find_open_time_config
from service.open_time_config_service import format_hhmm
from service.study_session_service import auto_release_expired_study_sessions
from utils.errors import BusinessError


def _is_today(record_time, today):
    return record_time and record_time.date() == today


def _time_in_range(current_time, start_time, end_time):
    return start_time and end_time and start_time <= current_time < end_time


def _display_status_for_seat(seat, now, config):
    if not seat.is_enabled or seat.status == "disabled":
        return "disabled"

    current_time = now.time()
    today = now.date()

    for study_session in seat.study_sessions:
        if study_session.status not in ["using", "leaving"]:
            continue
        reservation = study_session.reservation
        if not reservation:
            return study_session.status
        if _is_today(reservation.reserved_at, today) and reservation.end_time and current_time < reservation.end_time:
            return study_session.status

    sign_limit = config.sign_limit if config else 15
    sign_window_time = (now + timedelta(minutes=sign_limit)).time()
    for reservation in seat.reservations:
        if reservation.status not in ["active", "waiting"]:
            continue
        if not _is_today(reservation.reserved_at, today) or reservation.expire_at < now:
            continue
        if reservation.start_time <= sign_window_time and current_time < reservation.end_time:
            return "reserved"

    return "free"


def _seat_to_map_item(seat, now, config):
    return {
        "id": seat.id,
        "name": seat.seat_no,
        "floor": seat.row_no,
        "area": seat.area,
        "row_no": seat.row_no,
        "col_no": seat.col_no,
        "status": _display_status_for_seat(seat, now, config),
        "is_enabled": seat.is_enabled,
    }


def get_seat_list():
    auto_release_expired_study_sessions()
    now = datetime.now()
    config = find_open_time_config()
    return [_seat_to_map_item(seat, now, config) for seat in get_all_seat_models()]



def get_seat_reservation_periods(seat_id, date_text):
    seat = find_seat_by_id(seat_id)
    if not seat:
        raise BusinessError("Seat does not exist.", 404)

    try:
        target_date = datetime.strptime(date_text, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        raise BusinessError("date must use YYYY-MM-DD format.")

    reservations = find_effective_reservations_by_seat_and_date(seat_id, target_date)
    return [
        {
            "reservation_id": reservation.id,
            "start_time": format_hhmm(reservation.start_time) if reservation.start_time else None,
            "end_time": format_hhmm(reservation.end_time) if reservation.end_time else None,
            "status": reservation.status,
        }
        for reservation in reservations
    ]
