from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()

from model.checkin_record import CheckInRecord
from model.leave_record import LeaveRecord
from model.open_time_config import OpenTimeConfig
from model.reservation import Reservation
from model.seat import Seat
from model.study_session import StudySession
from model.user import User
from model.violation import Violation
