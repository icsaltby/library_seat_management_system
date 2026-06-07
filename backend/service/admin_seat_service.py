from dao.reservation_dao import find_active_reservation_by_seat
from dao.seat_dao import delete_seat, find_seat_by_id, find_seat_by_no, get_all_seat_models, save_seat
from dao.study_session_dao import find_active_session_by_seat
from model import Seat, db
from utils.errors import BusinessError


VALID_SEAT_STATUS = ["free", "reserved", "using", "leaving", "disabled"]
VALID_ENABLE_STATUS = ["enabled", "disabled"]


def _seat_to_dict(seat):
    return {
        "id": seat.id,
        "seat_no": seat.seat_no,
        "area": seat.area,
        "row_no": seat.row_no,
        "col_no": seat.col_no,
        "status": seat.status,
        "enable_status": seat.enable_status,
    }


def _validate_payload(data, is_update=False):
    required_fields = ["seat_no", "area", "row_no", "col_no"]
    if not is_update:
        for field in required_fields:
            if data.get(field) in [None, ""]:
                raise BusinessError(f"{field} is required.")

    status = data.get("status")
    enable_status = data.get("enable_status")
    if status and status not in VALID_SEAT_STATUS:
        raise BusinessError("Invalid seat status.")
    if enable_status and enable_status not in VALID_ENABLE_STATUS:
        raise BusinessError("Invalid enable status.")


def _has_active_usage(seat):
    if seat.status in ["reserved", "using", "leaving"]:
        return True
    if find_active_reservation_by_seat(seat.id):
        return True
    if find_active_session_by_seat(seat.id):
        return True
    return False


def get_admin_seats():
    return [_seat_to_dict(seat) for seat in get_all_seat_models()]


def create_admin_seat(data):
    _validate_payload(data)

    seat_no = data["seat_no"].strip()
    if find_seat_by_no(seat_no):
        raise BusinessError("Seat number already exists.")

    enable_status = data.get("enable_status", "enabled")
    status = data.get("status") or ("free" if enable_status == "enabled" else "disabled")
    seat = Seat(
        seat_no=seat_no,
        area=data["area"].strip(),
        row_no=int(data["row_no"]),
        col_no=int(data["col_no"]),
        status=status,
        enable_status=enable_status,
    )
    save_seat(seat)
    return _seat_to_dict(seat)


def update_admin_seat(seat_id, data):
    seat = find_seat_by_id(seat_id)
    if not seat:
        raise BusinessError("Seat does not exist.", 404)
    _validate_payload(data, is_update=True)

    if data.get("seat_no"):
        new_seat_no = data["seat_no"].strip()
        existing = find_seat_by_no(new_seat_no)
        if existing and existing.id != seat.id:
            raise BusinessError("Seat number already exists.")
        seat.seat_no = new_seat_no

    if data.get("area") is not None:
        seat.area = data["area"].strip()
    if data.get("row_no") is not None:
        seat.row_no = int(data["row_no"])
    if data.get("col_no") is not None:
        seat.col_no = int(data["col_no"])
    if data.get("status"):
        seat.status = data["status"]
    if data.get("enable_status"):
        if data["enable_status"] == "disabled" and _has_active_usage(seat):
            raise BusinessError("Seat is reserved or in use, cannot disable it.")
        seat.enable_status = data["enable_status"]
        if seat.enable_status == "disabled":
            seat.status = "disabled"
        elif seat.status == "disabled":
            seat.status = "free"

    db.session.commit()
    return _seat_to_dict(seat)


def delete_admin_seat(seat_id):
    seat = find_seat_by_id(seat_id)
    if not seat:
        raise BusinessError("Seat does not exist.", 404)
    if _has_active_usage(seat):
        raise BusinessError("Seat is reserved or in use, cannot delete it.")

    delete_seat(seat)
    return {"id": seat_id}


def enable_admin_seat(seat_id):
    seat = find_seat_by_id(seat_id)
    if not seat:
        raise BusinessError("Seat does not exist.", 404)

    seat.enable_status = "enabled"
    if seat.status == "disabled":
        seat.status = "free"
    db.session.commit()
    return _seat_to_dict(seat)


def disable_admin_seat(seat_id):
    seat = find_seat_by_id(seat_id)
    if not seat:
        raise BusinessError("Seat does not exist.", 404)
    if _has_active_usage(seat):
        raise BusinessError("Seat is reserved or in use, cannot disable it.")

    seat.enable_status = "disabled"
    seat.status = "disabled"
    db.session.commit()
    return _seat_to_dict(seat)
