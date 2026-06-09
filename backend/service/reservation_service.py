from datetime import datetime, timedelta

from dao.open_time_config_dao import find_open_time_config
from dao.reservation_dao import (
    find_active_reservation_by_seat,
    find_active_reservation_by_user,
    find_conflicting_reservation,
    find_reservation_by_id,
)
from dao.seat_dao import find_seat_by_id
from dao.study_session_dao import (
    find_active_session_by_seat,
    find_active_session_by_user,
    find_study_session_by_id,
)
from model import CheckInRecord, Reservation, StudySession, Violation, db
from service.open_time_config_service import format_hhmm, parse_hhmm
from service.study_session_service import auto_release_expired_study_sessions, study_session_to_dict
from utils.errors import BusinessError


def _reservation_to_dict(reservation):
    return {
        "id": reservation.id,
        "user_id": reservation.user_id,
        "seat_id": reservation.seat_id,
        "status": reservation.status,
        "reserve_time": format_hhmm(reservation.reserve_time) if reservation.reserve_time else None,
        "start_time": format_hhmm(reservation.start_time) if reservation.start_time else None,
        "end_time": format_hhmm(reservation.end_time) if reservation.end_time else None,
        "reserved_at": reservation.reserved_at.isoformat(),
        "expire_at": reservation.expire_at.isoformat(),
        "sign_deadline": reservation.expire_at.isoformat(),
        "checkin_at": reservation.checkin_at.isoformat() if reservation.checkin_at else None,
    }


def _time_ranges_overlap(start_time, end_time, existing_start_time, existing_end_time):
    if not existing_start_time or not existing_end_time:
        return True
    return start_time < existing_end_time and end_time > existing_start_time


def create_reservation(user, data):
    auto_release_expired_study_sessions()

    seat_id = data.get("seat_id")
    if not seat_id:
        raise BusinessError("seat_id is required.")

    config = find_open_time_config()
    now = datetime.now()
    current_time = now.time()
    if not config.reserve_start_time <= current_time <= config.reserve_end_time:
        raise BusinessError("Current time is outside the reservation time range.")

    start_time = parse_hhmm(data.get("start_time"), "start_time")
    end_time = parse_hhmm(data.get("end_time"), "end_time")
    if start_time >= end_time:
        raise BusinessError("start_time must be earlier than end_time.")
    if not (config.open_time <= start_time <= config.close_time):
        raise BusinessError("start_time is outside library open time.")
    if not (config.open_time <= end_time <= config.close_time):
        raise BusinessError("end_time is outside library open time.")
    if current_time > start_time:
        raise BusinessError("Current time cannot be later than start_time.")

    seat = find_seat_by_id(seat_id)
    if not seat:
        raise BusinessError("Seat does not exist.", 404)
    if not seat.is_enabled or seat.status == "disabled":
        raise BusinessError("Seat is disabled.")

    # One user can have only one active reservation or active study session.
    if find_active_reservation_by_user(user.id):
        raise BusinessError("You already have an active reservation.")
    if find_active_session_by_user(user.id):
        raise BusinessError("You already have an active study session.")

    # The same seat cannot have overlapping active reservations.
    if find_conflicting_reservation(seat.id, start_time, end_time, now.date()):
        raise BusinessError("Seat already has a reservation in this time period.")
    active_seat_session = find_active_session_by_seat(seat.id)
    if active_seat_session and _time_ranges_overlap(
        start_time,
        end_time,
        active_seat_session.reservation.start_time if active_seat_session.reservation else None,
        active_seat_session.reservation.end_time if active_seat_session.reservation else None,
    ):
        raise BusinessError("Seat is currently in use.")

    sign_deadline = datetime.combine(now.date(), start_time) + timedelta(minutes=config.sign_limit)

    reservation = Reservation(
        user_id=user.id,
        seat_id=seat.id,
        status="active",
        reserve_time=start_time,
        start_time=start_time,
        end_time=end_time,
        expire_at=sign_deadline,
    )
    # If the reservation will start soon, show the seat as reserved on the map.
    if start_time <= (now + timedelta(minutes=config.sign_limit)).time():
        seat.status = "reserved"
    db.session.add(reservation)
    db.session.commit()
    return _reservation_to_dict(reservation)


def get_my_active_reservation(user):
    reservation = find_active_reservation_by_user(user.id)
    if not reservation:
        return None

    data = _reservation_to_dict(reservation)
    data["seat"] = {
        "id": reservation.seat.id,
        "name": reservation.seat.seat_no,
        "floor": reservation.seat.row_no,
        "area": reservation.seat.area,
        "status": reservation.seat.status,
    }
    return data


def checkin_reservation(user, reservation_id):
    auto_release_expired_study_sessions()

    reservation = find_reservation_by_id(reservation_id)
    if not reservation:
        raise BusinessError("Reservation does not exist.", 404)
    if reservation.user_id != user.id:
        raise BusinessError("You can only check in your own reservation.", 403)
    if reservation.status != "active":
        raise BusinessError("Reservation is not active.")
    if find_active_session_by_user(user.id):
        raise BusinessError("You already have an active study session.")

    seat = reservation.seat
    if not seat or not seat.is_enabled:
        raise BusinessError("Seat is disabled.")
    active_seat_session = find_active_session_by_seat(seat.id)
    if (
        active_seat_session
        and active_seat_session.reservation_id != reservation.id
        and _time_ranges_overlap(
            reservation.start_time,
            reservation.end_time,
            active_seat_session.reservation.start_time if active_seat_session.reservation else None,
            active_seat_session.reservation.end_time if active_seat_session.reservation else None,
        )
    ):
        raise BusinessError("Seat is currently in use.")

    now = datetime.now()
    config = find_open_time_config()
    if reservation.start_time:
        earliest_checkin_at = datetime.combine(now.date(), reservation.start_time) - timedelta(minutes=5)
        if now < earliest_checkin_at:
            raise BusinessError("You can check in at most 5 minutes before the reservation starts.")

    sign_deadline = datetime.combine(datetime.now().date(), reservation.start_time) + timedelta(
        minutes=config.sign_limit
    )
    if sign_deadline < now:
        # Timeout follows reserved -> timeout -> free, and creates a violation.
        reservation.status = "timeout"
        if seat.status == "reserved":
            seat.status = "free"
        violation = Violation(
            user_id=user.id,
            seat_id=seat.id,
            reservation_id=reservation.id,
            violation_type="reservation_timeout",
            description="Reservation expired before check-in.",
        )
        db.session.add(violation)
        db.session.commit()
        raise BusinessError("Reservation has expired.")

    reservation.status = "checked_in"
    reservation.checkin_at = now
    seat.status = "using"

    study_session = StudySession(
        user_id=user.id,
        seat_id=seat.id,
        reservation_id=reservation.id,
        status="using",
        start_at=now,
    )
    checkin_record = CheckInRecord(
        user_id=user.id,
        seat_id=seat.id,
        reservation_id=reservation.id,
        checkin_at=now,
        result="success",
    )
    db.session.add(study_session)
    db.session.add(checkin_record)
    db.session.commit()
    return study_session_to_dict(study_session)
