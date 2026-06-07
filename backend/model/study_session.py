from datetime import datetime

from model import db


class StudySession(db.Model):
    __tablename__ = "study_session"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    seat_id = db.Column(db.Integer, db.ForeignKey("seat.id"), nullable=False)
    reservation_id = db.Column(db.Integer, db.ForeignKey("reservation.id"), nullable=True)
    status = db.Column(db.String(20), nullable=False, default="using")
    start_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship("User", back_populates="study_sessions")
    seat = db.relationship("Seat", back_populates="study_sessions")
    reservation = db.relationship("Reservation")
    leave_records = db.relationship("LeaveRecord", back_populates="study_session")
