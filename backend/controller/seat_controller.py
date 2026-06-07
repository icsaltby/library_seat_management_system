from flask import Blueprint

from service.seat_service import get_seat_list
from utils.response import success


seat_bp = Blueprint("seat", __name__)


@seat_bp.get("")
def list_seats():
    seats = get_seat_list()
    return success(seats)
