from datetime import datetime

from model import db


class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    real_name = db.Column(db.String(50), nullable=True)
    student_no = db.Column(db.String(50), unique=True, nullable=True)
    role = db.Column(db.String(20), nullable=False, default="user")
    status = db.Column(db.String(20), nullable=False, default="active")
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    reservations = db.relationship("Reservation", back_populates="user")
    study_sessions = db.relationship("StudySession", back_populates="user")
    checkin_records = db.relationship("CheckInRecord", back_populates="user")
    leave_records = db.relationship("LeaveRecord", back_populates="user")
    violations = db.relationship("Violation", back_populates="user")
