from model import User, db


def find_user_by_id(user_id):
    return User.query.get(user_id)


def find_user_by_username(username):
    return User.query.filter_by(username=username).first()


def find_user_by_student_no(student_no):
    if not student_no:
        return None
    return User.query.filter_by(student_no=student_no).first()


def save_user(user):
    db.session.add(user)
    db.session.commit()
    return user
