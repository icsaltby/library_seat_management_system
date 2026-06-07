from datetime import datetime

from model import db


class Seat(db.Model):
    __tablename__ = "seat"

    id = db.Column(db.Integer, primary_key=True)
    seat_no = db.Column(db.String(30), unique=True, nullable=False)
    area = db.Column(db.String(50), nullable=False)
    row_no = db.Column(db.Integer, nullable=False)
    col_no = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="free")
    enable_status = db.Column(db.String(20), nullable=False, default="enabled")
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    reservations = db.relationship("Reservation", back_populates="seat")
    study_sessions = db.relationship("StudySession", back_populates="seat")
    checkin_records = db.relationship("CheckInRecord", back_populates="seat")
    leave_records = db.relationship("LeaveRecord", back_populates="seat")
    violations = db.relationship("Violation", back_populates="seat")

    @property
    def is_enabled(self):
        return self.enable_status == "enabled"
