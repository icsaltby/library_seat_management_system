from model import Seat


def find_seat_by_id(seat_id):
    return Seat.query.get(seat_id)


def find_seat_by_no(seat_no):
    return Seat.query.filter_by(seat_no=seat_no).first()


def get_all_seat_models():
    return Seat.query.order_by(Seat.area.asc(), Seat.row_no.asc(), Seat.col_no.asc()).all()


def save_seat(seat):
    from model import db

    db.session.add(seat)
    db.session.commit()
    return seat


def delete_seat(seat):
    from model import db

    db.session.delete(seat)
    db.session.commit()


def find_all_seats():
    seats = get_all_seat_models()
    return [
        {
            "id": seat.id,
            "name": seat.seat_no,
            "floor": seat.row_no,
            "area": seat.area,
            "row_no": seat.row_no,
            "col_no": seat.col_no,
            "status": seat.status,
            "is_enabled": seat.is_enabled,
        }
        for seat in seats
    ]
