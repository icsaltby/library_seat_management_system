from flask import Blueprint, request

from service.admin_seat_service import (
    create_admin_seat,
    delete_admin_seat,
    disable_admin_seat,
    enable_admin_seat,
    get_admin_seats,
    update_admin_seat,
)
from utils.auth import admin_required
from utils.response import success


admin_seat_bp = Blueprint("admin_seat", __name__)


@admin_seat_bp.get("/seats")
@admin_required
def list_admin_seats():
    return success(get_admin_seats())


@admin_seat_bp.post("/seats")
@admin_required
def create_seat():
    seat = create_admin_seat(request.get_json(silent=True) or {})
    return success(seat, "Create seat successfully.", 201)


@admin_seat_bp.put("/seats/<int:seat_id>")
@admin_required
def update_seat(seat_id):
    seat = update_admin_seat(seat_id, request.get_json(silent=True) or {})
    return success(seat, "Update seat successfully.")


@admin_seat_bp.delete("/seats/<int:seat_id>")
@admin_required
def delete_seat(seat_id):
    return success(delete_admin_seat(seat_id), "Delete seat successfully.")


@admin_seat_bp.patch("/seats/<int:seat_id>/enable")
@admin_required
def enable_seat(seat_id):
    return success(enable_admin_seat(seat_id), "Enable seat successfully.")


@admin_seat_bp.patch("/seats/<int:seat_id>/disable")
@admin_required
def disable_seat(seat_id):
    return success(disable_admin_seat(seat_id), "Disable seat successfully.")
