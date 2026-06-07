from model import StudySession, db


def find_study_session_by_id(study_session_id):
    return StudySession.query.get(study_session_id)


def find_active_session_by_user(user_id):
    return StudySession.query.filter(
        StudySession.user_id == user_id,
        StudySession.status.in_(["using", "leaving"]),
    ).first()


def find_current_session_by_user(user_id):
    return find_active_session_by_user(user_id)


def find_active_session_by_seat(seat_id):
    return StudySession.query.filter(
        StudySession.seat_id == seat_id,
        StudySession.status.in_(["using", "leaving"]),
    ).first()


def save_study_session(study_session):
    db.session.add(study_session)
    db.session.commit()
    return study_session
