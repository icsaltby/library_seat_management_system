from flask import current_app
from werkzeug.security import check_password_hash, generate_password_hash

from dao.user_dao import find_user_by_student_no, find_user_by_username, save_user
from model import User
from utils.errors import BusinessError
from utils.jwt_util import generate_token


def _user_to_dict(user):
    return {
        "id": user.id,
        "username": user.username,
        "real_name": user.real_name,
        "student_no": user.student_no,
        "role": user.role,
        "status": user.status,
    }


def register_user(data):
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    real_name = (data.get("real_name") or "").strip() or None
    student_no = (data.get("student_no") or "").strip() or None
    role = data.get("role") or "user"

    if not username or not password:
        raise BusinessError("Username and password are required.")
    if role not in ["user", "admin"]:
        raise BusinessError("Role must be user or admin.")
    if find_user_by_username(username):
        raise BusinessError("Username already exists.")
    if find_user_by_student_no(student_no):
        raise BusinessError("Student number already exists.")

    user = User(
        username=username,
        password_hash=generate_password_hash(password),
        real_name=real_name,
        student_no=student_no,
        role=role,
    )
    save_user(user)
    return _user_to_dict(user)


def login_user(data):
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        raise BusinessError("Username and password are required.")

    user = find_user_by_username(username)
    if not user or not check_password_hash(user.password_hash, password):
        raise BusinessError("Invalid username or password.", 401)
    if user.status != "active":
        raise BusinessError("User account is not active.", 403)

    token = generate_token(
        {"user_id": user.id, "username": user.username, "role": user.role},
        current_app.config["SECRET_KEY"],
    )
    return {
        "token": token,
        "user": _user_to_dict(user),
    }
