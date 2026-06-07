from model import StudySession, Violation


def find_finished_sessions_by_user(user_id):
    return StudySession.query.filter(
        StudySession.user_id == user_id,
        StudySession.end_at.isnot(None),
    ).all()


def count_violations_by_user(user_id):
    return Violation.query.filter_by(user_id=user_id).count()
