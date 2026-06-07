from datetime import datetime

from model import db


class Violation(db.Model):
    __tablename__ = "violation"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    seat_id = db.Column(db.Integer, db.ForeignKey("seat.id"), nullable=True)
    reservation_id = db.Column(db.Integer, db.ForeignKey("reservation.id"), nullable=True)
    study_session_id = db.Column(db.Integer, db.ForeignKey("study_session.id"), nullable=True)
    violation_type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    handle_status = db.Column(db.String(20), nullable=False, default="unhandled")
    handled_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    user = db.relationship("User", back_populates="violations")
    seat = db.relationship("Seat", back_populates="violations")
    reservation = db.relationship("Reservation")
    study_session = db.relationship("StudySession")
