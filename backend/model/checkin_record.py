from datetime import datetime

from model import db


class CheckInRecord(db.Model):
    __tablename__ = "checkin_record"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    seat_id = db.Column(db.Integer, db.ForeignKey("seat.id"), nullable=False)
    reservation_id = db.Column(db.Integer, db.ForeignKey("reservation.id"), nullable=False)
    checkin_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    result = db.Column(db.String(20), nullable=False, default="success")

    user = db.relationship("User", back_populates="checkin_records")
    seat = db.relationship("Seat", back_populates="checkin_records")
    reservation = db.relationship("Reservation", back_populates="checkin_records")
