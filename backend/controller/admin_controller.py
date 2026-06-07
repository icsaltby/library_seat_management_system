from flask import Blueprint

from service.admin_service import (
    ban_user,
    get_admin_statistics,
    get_admin_users,
    get_admin_violations,
    handle_violation,
    unban_user,
)
from utils.auth import admin_required
from utils.response import success


admin_bp = Blueprint("admin", __name__)


@admin_bp.get("/statistics")
@admin_required
def statistics():
    return success(get_admin_statistics())


@admin_bp.get("/violations")
@admin_required
def violations():
    return success(get_admin_violations())


@admin_bp.patch("/violations/<int:violation_id>/handle")
@admin_required
def handle_violation_record(violation_id):
    return success(handle_violation(violation_id), "Violation handled successfully.")


@admin_bp.get("/users")
@admin_required
def users():
    return success(get_admin_users())


@admin_bp.patch("/users/<int:user_id>/ban")
@admin_required
def ban(user_id):
    return success(ban_user(user_id), "User banned successfully.")


@admin_bp.patch("/users/<int:user_id>/unban")
@admin_required
def unban(user_id):
    return success(unban_user(user_id), "User unbanned successfully.")
