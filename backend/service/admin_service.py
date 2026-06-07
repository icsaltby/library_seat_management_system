from datetime import datetime, time

from dao.admin_dao import (
    count_reservations_since,
    count_seats,
    count_seats_by_status,
    count_violations,
    get_all_users,
    get_all_violations,
    get_finished_sessions_since,
    get_user_by_id,
    get_violation_by_id,
)
from model import db
from utils.errors import BusinessError


def _user_to_dict(user):
    return {
        "id": user.id,
        "username": user.username,
        "real_name": user.real_name,
        "student_no": user.student_no,
        "role": user.role,
        "status": user.status,
        "created_at": user.created_at.isoformat(),
    }


def _violation_to_dict(violation):
    return {
        "id": violation.id,
        "user_id": violation.user_id,
        "username": violation.user.username if violation.user else None,
        "seat_id": violation.seat_id,
        "seat_no": violation.seat.seat_no if violation.seat else None,
        "reservation_id": violation.reservation_id,
        "study_session_id": violation.study_session_id,
        "violation_type": violation.violation_type,
        "description": violation.description,
        "handle_status": violation.handle_status,
        "handled_at": violation.handled_at.isoformat() if violation.handled_at else None,
        "created_at": violation.created_at.isoformat(),
    }


def get_admin_statistics():
    today_start = datetime.combine(datetime.today(), time.min)
    finished_sessions = get_finished_sessions_since(today_start)
    today_duration = 0
    for session in finished_sessions:
        today_duration += max(0, int((session.end_at - session.start_at).total_seconds() // 60))

    return {
        "total_seats": count_seats(),
        "free_seats": count_seats_by_status("free"),
        "using_seats": count_seats_by_status("using"),
        "reserved_seats": count_seats_by_status("reserved"),
        "today_reservation_count": count_reservations_since(today_start),
        "today_total_duration": today_duration,
        "violation_count": count_violations(),
    }


def get_admin_users():
    return [_user_to_dict(user) for user in get_all_users()]


def ban_user(user_id):
    user = get_user_by_id(user_id)
    if not user:
        raise BusinessError("User does not exist.", 404)
    if user.role == "admin":
        raise BusinessError("Admin user cannot be banned.")

    user.status = "banned"
    db.session.commit()
    return _user_to_dict(user)


def unban_user(user_id):
    user = get_user_by_id(user_id)
    if not user:
        raise BusinessError("User does not exist.", 404)

    user.status = "active"
    db.session.commit()
    return _user_to_dict(user)


def get_admin_violations():
    return [_violation_to_dict(violation) for violation in get_all_violations()]


def handle_violation(violation_id):
    violation = get_violation_by_id(violation_id)
    if not violation:
        raise BusinessError("Violation does not exist.", 404)

    violation.handle_status = "handled"
    violation.handled_at = datetime.now()
    db.session.commit()
    return _violation_to_dict(violation)
