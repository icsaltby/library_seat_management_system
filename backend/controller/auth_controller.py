from flask import Blueprint, request

from service.auth_service import login_user, register_user
from utils.response import success


auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    user = register_user(request.get_json(silent=True) or {})
    return success(user, "Register successfully.", 201)


@auth_bp.post("/login")
def login():
    login_result = login_user(request.get_json(silent=True) or {})
    return success(login_result, "Login successfully.")
