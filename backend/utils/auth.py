from functools import wraps

from flask import current_app, g, request

from dao.user_dao import find_user_by_id
from utils.errors import BusinessError
from utils.jwt_util import verify_token


def login_required(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise BusinessError("Please login first.", 401)

        token = auth_header.replace("Bearer ", "", 1).strip()
        payload = verify_token(token, current_app.config["SECRET_KEY"])
        if not payload:
            raise BusinessError("Invalid or expired token.", 401)

        user = find_user_by_id(payload.get("user_id"))
        if not user:
            raise BusinessError("User does not exist.", 401)

        g.current_user = user
        return view_func(*args, **kwargs)

    return wrapper


def admin_required(view_func):
    @wraps(view_func)
    @login_required
    def wrapper(*args, **kwargs):
        if g.current_user.role != "admin":
            raise BusinessError("Admin permission is required.", 403)
        return view_func(*args, **kwargs)

    return wrapper
