from model import Reservation, Seat, StudySession, User, Violation


def get_all_users():
    return User.query.order_by(User.id.asc()).all()


def get_user_by_id(user_id):
    return User.query.get(user_id)


def get_all_violations():
    return Violation.query.order_by(Violation.created_at.desc()).all()


def get_violation_by_id(violation_id):
    return Violation.query.get(violation_id)


def count_seats():
    return Seat.query.count()


def count_seats_by_status(status):
    return Seat.query.filter_by(status=status).count()


def count_reservations_since(start_time):
    return Reservation.query.filter(Reservation.reserved_at >= start_time).count()


def get_finished_sessions_since(start_time):
    return StudySession.query.filter(
        StudySession.end_at.isnot(None),
        StudySession.end_at >= start_time,
    ).all()


def count_violations():
    return Violation.query.count()
