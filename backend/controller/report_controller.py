from flask import Blueprint, g

from service.report_service import get_my_report
from utils.auth import login_required
from utils.response import success


report_bp = Blueprint("report", __name__)


@report_bp.get("/me")
@login_required
def my_report():
    return success(get_my_report(g.current_user))
