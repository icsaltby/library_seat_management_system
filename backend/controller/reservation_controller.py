from flask import Blueprint, g, request

from service.reservation_service import checkin_reservation, create_reservation, get_my_active_reservation
from utils.auth import login_required
from utils.response import success


reservation_bp = Blueprint("reservation", __name__)


@reservation_bp.post("")
@login_required
def reserve_seat():
    reservation = create_reservation(g.current_user, request.get_json(silent=True) or {})
    return success(reservation, "Reserve seat successfully.", 201)


@reservation_bp.get("/me")
@login_required
def my_reservation():
    reservation = get_my_active_reservation(g.current_user)
    return success(reservation)


@reservation_bp.post("/<int:reservation_id>/checkin")
@login_required
def checkin(reservation_id):
    study_session = checkin_reservation(g.current_user, reservation_id)
    return success(study_session, "Check in successfully.")
