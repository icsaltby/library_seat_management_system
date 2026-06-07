from model import db


class OpenTimeConfig(db.Model):
    __tablename__ = "open_time_config"

    id = db.Column(db.Integer, primary_key=True)
    open_time = db.Column(db.Time, nullable=False)
    close_time = db.Column(db.Time, nullable=False)
    reserve_start_time = db.Column(db.Time, nullable=False)
    reserve_end_time = db.Column(db.Time, nullable=False)
    sign_limit = db.Column(db.Integer, nullable=False, default=15)
    leave_limit = db.Column(db.Integer, nullable=False, default=15)
