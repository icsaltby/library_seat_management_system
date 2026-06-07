from datetime import datetime

from model import db


class LeaveRecord(db.Model):
    __tablename__ = "leave_record"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    seat_id = db.Column(db.Integer, db.ForeignKey("seat.id"), nullable=False)
    study_session_id = db.Column(db.Integer, db.ForeignKey("study_session.id"), nullable=False)
    leave_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    expire_at = db.Column(db.DateTime, nullable=False)
    return_at = db.Column(db.DateTime, nullable=True)
    duration_minutes = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="leaving")

    user = db.relationship("User", back_populates="leave_records")
    seat = db.relationship("Seat", back_populates="leave_records")
    study_session = db.relationship("StudySession", back_populates="leave_records")
