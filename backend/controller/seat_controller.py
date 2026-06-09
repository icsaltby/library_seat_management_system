from flask import Blueprint, request

from service.seat_service import get_seat_list, get_seat_reservation_periods
from utils.response import success


seat_bp = Blueprint("seat", __name__)


@seat_bp.get("")
def list_seats():
    seats = get_seat_list()
    return success(seats)


@seat_bp.get("/<int:seat_id>/reservations")
def list_seat_reservations(seat_id):
    reservations = get_seat_reservation_periods(seat_id, request.args.get("date"))
    return success(reservations)
