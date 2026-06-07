from flask import Blueprint, g

from service.study_session_service import (
    get_my_current_session,
    leave_study_session,
    release_study_session,
    return_study_session,
)
from utils.auth import login_required
from utils.response import success


study_session_bp = Blueprint("study_session", __name__)


@study_session_bp.get("/me")
@login_required
def current_session():
    return success(get_my_current_session(g.current_user))


@study_session_bp.post("/<int:study_session_id>/leave")
@login_required
def leave(study_session_id):
    study_session = leave_study_session(g.current_user, study_session_id)
    return success(study_session, "Leave seat successfully.")


@study_session_bp.post("/<int:study_session_id>/return")
@login_required
def return_seat(study_session_id):
    study_session = return_study_session(g.current_user, study_session_id)
    return success(study_session, "Return to seat successfully.")


@study_session_bp.post("/<int:study_session_id>/release")
@login_required
def release(study_session_id):
    study_session = release_study_session(g.current_user, study_session_id)
    return success(study_session, "Release seat successfully.")
