from datetime import datetime

from model import db


class Reservation(db.Model):
    __tablename__ = "reservation"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    seat_id = db.Column(db.Integer, db.ForeignKey("seat.id"), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="active")
    reserve_time = db.Column(db.Time, nullable=True)
    start_time = db.Column(db.Time, nullable=True)
    end_time = db.Column(db.Time, nullable=True)
    reserved_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    expire_at = db.Column(db.DateTime, nullable=False)
    checkin_at = db.Column(db.DateTime, nullable=True)
    canceled_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship("User", back_populates="reservations")
    seat = db.relationship("Seat", back_populates="reservations")
    checkin_records = db.relationship("CheckInRecord", back_populates="reservation")
