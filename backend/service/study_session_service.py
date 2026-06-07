from datetime import datetime, timedelta

from dao.leave_record_dao import find_active_leave_by_session
from dao.open_time_config_dao import find_open_time_config
from dao.reservation_dao import find_reservation_by_id
from dao.study_session_dao import find_current_session_by_user, find_study_session_by_id
from model import LeaveRecord, Violation, db
from utils.errors import BusinessError


def _leave_to_dict(leave_record):
    if not leave_record:
        return None

    now = datetime.now()
    remaining_seconds = max(0, int((leave_record.expire_at - now).total_seconds()))
    return {
        "id": leave_record.id,
        "leave_at": leave_record.leave_at.isoformat(),
        "expire_at": leave_record.expire_at.isoformat(),
        "return_at": leave_record.return_at.isoformat() if leave_record.return_at else None,
        "duration_minutes": leave_record.duration_minutes,
        "remaining_seconds": remaining_seconds,
        "status": leave_record.status,
    }


def study_session_to_dict(study_session):
    active_leave = find_active_leave_by_session(study_session.id)
    return {
        "id": study_session.id,
        "user_id": study_session.user_id,
        "seat_id": study_session.seat_id,
        "reservation_id": study_session.reservation_id,
        "status": study_session.status,
        "start_at": study_session.start_at.isoformat(),
        "end_at": study_session.end_at.isoformat() if study_session.end_at else None,
        "seat": {
            "id": study_session.seat.id,
            "name": study_session.seat.seat_no,
            "area": study_session.seat.area,
            "row_no": study_session.seat.row_no,
            "col_no": study_session.seat.col_no,
            "status": study_session.seat.status,
        },
        "leave_record": _leave_to_dict(active_leave),
    }


def get_my_current_session(user):
    study_session = find_current_session_by_user(user.id)
    if not study_session:
        return None
    return study_session_to_dict(study_session)


def leave_study_session(user, study_session_id):
    study_session = find_study_session_by_id(study_session_id)
    if not study_session:
        raise BusinessError("Study session does not exist.", 404)
    if study_session.user_id != user.id:
        raise BusinessError("You can only leave your own seat.", 403)
    if study_session.status != "using":
        raise BusinessError("Only using study sessions can leave temporarily.")

    config = find_open_time_config()
    now = datetime.now()
    leave_record = LeaveRecord(
        user_id=user.id,
        seat_id=study_session.seat_id,
        study_session_id=study_session.id,
        leave_at=now,
        expire_at=now + timedelta(minutes=config.leave_limit),
        status="leaving",
    )
    study_session.status = "leaving"
    study_session.seat.status = "leaving"
    db.session.add(leave_record)
    db.session.commit()
    return study_session_to_dict(study_session)


def return_study_session(user, study_session_id):
    study_session = find_study_session_by_id(study_session_id)
    if not study_session:
        raise BusinessError("Study session does not exist.", 404)
    if study_session.user_id != user.id:
        raise BusinessError("You can only return to your own seat.", 403)
    if study_session.status != "leaving":
        raise BusinessError("Only leaving study sessions can return.")

    leave_record = find_active_leave_by_session(study_session.id)
    if not leave_record:
        raise BusinessError("Active leave record does not exist.")

    now = datetime.now()
    leave_record.return_at = now
    leave_record.duration_minutes = max(0, int((now - leave_record.leave_at).total_seconds() // 60))

    if now <= leave_record.expire_at:
        leave_record.status = "returned"
        study_session.status = "using"
        study_session.seat.status = "using"
        db.session.commit()
        return study_session_to_dict(study_session)

    leave_record.status = "timeout"
    study_session.status = "released"
    study_session.end_at = now
    study_session.seat.status = "free"
    if study_session.reservation:
        study_session.reservation.status = "completed"
    violation = Violation(
        user_id=user.id,
        seat_id=study_session.seat_id,
        reservation_id=study_session.reservation_id,
        study_session_id=study_session.id,
        violation_type="leave_timeout",
        description="User returned after temporary leave limit.",
    )
    db.session.add(violation)
    db.session.commit()
    raise BusinessError("Leave time exceeded. Seat has been released.")


def release_study_session(user, study_session_id):
    study_session = find_study_session_by_id(study_session_id)
    if not study_session:
        raise BusinessError("Study session does not exist.", 404)
    if study_session.user_id != user.id and user.role != "admin":
        raise BusinessError("You can only release your own seat.", 403)
    if study_session.status not in ["using", "leaving"]:
        raise BusinessError("Study session is not active.")

    active_leave = find_active_leave_by_session(study_session.id)
    now = datetime.now()
    if active_leave:
        active_leave.return_at = now
        active_leave.duration_minutes = max(0, int((now - active_leave.leave_at).total_seconds() // 60))
        active_leave.status = "released"

    study_session.status = "released"
    study_session.end_at = now
    study_session.seat.status = "free"
    if study_session.reservation:
        study_session.reservation.status = "completed"
    db.session.commit()
    return study_session_to_dict(study_session)


def check_timeouts():
    now = datetime.now()
    reservation_timeout_count = 0
    leave_timeout_count = 0

    from model import Reservation, StudySession

    expired_reservations = Reservation.query.filter(
        Reservation.status == "active",
        Reservation.expire_at < now,
    ).all()
    for reservation in expired_reservations:
        reservation.status = "timeout"
        if reservation.seat.status == "reserved":
            reservation.seat.status = "free"
        db.session.add(
            Violation(
                user_id=reservation.user_id,
                seat_id=reservation.seat_id,
                reservation_id=reservation.id,
                violation_type="reservation_timeout",
                description="Reservation expired before check-in.",
            )
        )
        reservation_timeout_count += 1

    expired_leaves = LeaveRecord.query.filter(
        LeaveRecord.status == "leaving",
        LeaveRecord.expire_at < now,
    ).all()
    for leave_record in expired_leaves:
        study_session = StudySession.query.get(leave_record.study_session_id)
        leave_record.status = "timeout"
        leave_record.return_at = now
        leave_record.duration_minutes = max(0, int((now - leave_record.leave_at).total_seconds() // 60))
        if study_session and study_session.status == "leaving":
            study_session.status = "released"
            study_session.end_at = now
            study_session.seat.status = "free"
            if study_session.reservation:
                study_session.reservation.status = "completed"
            db.session.add(
                Violation(
                    user_id=study_session.user_id,
                    seat_id=study_session.seat_id,
                    reservation_id=study_session.reservation_id,
                    study_session_id=study_session.id,
                    violation_type="leave_timeout",
                    description="Temporary leave expired.",
                )
            )
        leave_timeout_count += 1

    db.session.commit()
    return {
        "reservation_timeout_count": reservation_timeout_count,
        "leave_timeout_count": leave_timeout_count,
    }
