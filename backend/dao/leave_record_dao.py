from model import LeaveRecord


def find_active_leave_by_session(study_session_id):
    return LeaveRecord.query.filter_by(study_session_id=study_session_id, status="leaving").first()
