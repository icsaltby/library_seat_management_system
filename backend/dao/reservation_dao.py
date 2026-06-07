from datetime import datetime

from model import Reservation, db


def find_reservation_by_id(reservation_id):
    return Reservation.query.get(reservation_id)


def find_active_reservation_by_user(user_id):
    return Reservation.query.filter_by(user_id=user_id, status="active").first()


def find_active_reservation_by_seat(seat_id):
    return Reservation.query.filter_by(seat_id=seat_id, status="active").first()


def find_conflicting_reservation(seat_id, start_time, end_time):
    return Reservation.query.filter(
        Reservation.seat_id == seat_id,
        Reservation.status.in_(["active", "checked_in"]),
        Reservation.expire_at >= datetime.now(),
        Reservation.start_time < end_time,
        Reservation.end_time > start_time,
    ).first()


def save_reservation(reservation):
    db.session.add(reservation)
    db.session.commit()
    return reservation
