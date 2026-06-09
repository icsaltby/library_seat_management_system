from datetime import datetime

from sqlalchemy import and_, func, or_

from model import Reservation, db


def find_reservation_by_id(reservation_id):
    return Reservation.query.get(reservation_id)


def find_active_reservation_by_user(user_id):
    return Reservation.query.filter_by(user_id=user_id, status="active").first()


def find_active_reservation_by_seat(seat_id):
    return Reservation.query.filter_by(seat_id=seat_id, status="active").first()


def find_conflicting_reservation(seat_id, start_time, end_time, target_date):
    now = datetime.now()
    reserved_statuses = ["active", "waiting"]
    started_statuses = ["checked_in", "using", "leaving", "checked", "ongoing"]
    return Reservation.query.filter(
        Reservation.seat_id == seat_id,
        or_(
            and_(Reservation.status.in_(reserved_statuses), Reservation.expire_at >= now),
            Reservation.status.in_(started_statuses),
        ),
        func.date(Reservation.reserved_at) == target_date.isoformat(),
        Reservation.start_time < end_time,
        Reservation.end_time > start_time,
    ).first()


def find_effective_reservations_by_seat_and_date(seat_id, target_date):
    now = datetime.now()
    reserved_statuses = ["active", "waiting"]
    started_statuses = ["checked_in", "using", "leaving", "checked", "ongoing"]
    return (
        Reservation.query.filter(
            Reservation.seat_id == seat_id,
            or_(
                and_(Reservation.status.in_(reserved_statuses), Reservation.expire_at >= now),
                Reservation.status.in_(started_statuses),
            ),
            func.date(Reservation.reserved_at) == target_date.isoformat(),
        )
        .order_by(Reservation.start_time.asc())
        .all()
    )


def save_reservation(reservation):
    db.session.add(reservation)
    db.session.commit()
    return reservation
