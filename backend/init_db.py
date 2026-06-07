from datetime import datetime, time, timedelta

from werkzeug.security import generate_password_hash

from app import create_app
from model import (
    CheckInRecord,
    LeaveRecord,
    OpenTimeConfig,
    Reservation,
    Seat,
    StudySession,
    User,
    Violation,
    db,
)


def seed_demo_users():
    users = [
        User(
            username="student",
            password_hash=generate_password_hash("123456"),
            real_name="Demo Student",
            student_no="S2024001",
            role="user",
            status="active",
        ),
        User(
            username="admin",
            password_hash=generate_password_hash("admin123"),
            real_name="Demo Admin",
            student_no="A2024001",
            role="admin",
            status="active",
        ),
        User(
            username="student2",
            password_hash=generate_password_hash("123456"),
            real_name="Reserved User",
            student_no="S2024002",
            role="user",
            status="active",
        ),
        User(
            username="student3",
            password_hash=generate_password_hash("123456"),
            real_name="Using User",
            student_no="S2024003",
            role="user",
            status="active",
        ),
        User(
            username="student4",
            password_hash=generate_password_hash("123456"),
            real_name="Leaving User",
            student_no="S2024004",
            role="user",
            status="active",
        ),
    ]
    db.session.add_all(users)
    db.session.flush()
    return {user.username: user for user in users}


def seed_demo_seats():
    demo_seats = []
    for area_code in ["A", "B", "C"]:
        for col_no in range(1, 11):
            seat_no = f"{area_code}-{col_no:03d}"
            demo_seats.append(
                Seat(
                    seat_no=seat_no,
                    area=f"{area_code}\u533a",
                    row_no=ord(area_code) - ord("A") + 1,
                    col_no=col_no,
                    status="free",
                    enable_status="enabled",
                )
            )

    demo_seats[1].status = "reserved"
    demo_seats[2].status = "using"
    demo_seats[3].status = "leaving"
    demo_seats[-1].status = "disabled"
    demo_seats[-1].enable_status = "disabled"

    db.session.add_all(demo_seats)
    db.session.flush()
    return {seat.seat_no: seat for seat in demo_seats}


def seed_open_time_config():
    config = OpenTimeConfig(
        open_time=time(hour=8, minute=0),
        close_time=time(hour=22, minute=0),
        reserve_start_time=time(hour=7, minute=30),
        reserve_end_time=time(hour=21, minute=30),
        sign_limit=15,
        leave_limit=15,
    )
    db.session.add(config)


def seed_demo_business_data(users, seats):
    now = datetime.now().replace(second=0, microsecond=0)
    today_start = now.replace(hour=8, minute=30)

    active_reservation = Reservation(
        user_id=users["student2"].id,
        seat_id=seats["A-002"].id,
        status="active",
        reserve_time=(now + timedelta(minutes=10)).time(),
        start_time=(now + timedelta(minutes=10)).time(),
        end_time=(now + timedelta(hours=2)).time(),
        reserved_at=now - timedelta(minutes=5),
        expire_at=now + timedelta(minutes=25),
    )

    using_reservation = Reservation(
        user_id=users["student3"].id,
        seat_id=seats["A-003"].id,
        status="checked_in",
        reserve_time=today_start.time(),
        start_time=today_start.time(),
        end_time=(today_start + timedelta(hours=3)).time(),
        reserved_at=today_start - timedelta(minutes=15),
        expire_at=today_start + timedelta(minutes=15),
        checkin_at=today_start,
    )
    using_session = StudySession(
        user_id=users["student3"].id,
        seat_id=seats["A-003"].id,
        reservation=using_reservation,
        status="using",
        start_at=today_start,
    )

    leaving_reservation = Reservation(
        user_id=users["student4"].id,
        seat_id=seats["A-004"].id,
        status="checked_in",
        reserve_time=(today_start + timedelta(minutes=30)).time(),
        start_time=(today_start + timedelta(minutes=30)).time(),
        end_time=(today_start + timedelta(hours=4)).time(),
        reserved_at=today_start,
        expire_at=today_start + timedelta(minutes=45),
        checkin_at=today_start + timedelta(minutes=30),
    )
    leaving_session = StudySession(
        user_id=users["student4"].id,
        seat_id=seats["A-004"].id,
        reservation=leaving_reservation,
        status="leaving",
        start_at=today_start + timedelta(minutes=30),
    )

    db.session.add_all([active_reservation, using_reservation, using_session, leaving_reservation, leaving_session])
    db.session.flush()

    leave_record = LeaveRecord(
        user_id=users["student4"].id,
        seat_id=seats["A-004"].id,
        study_session_id=leaving_session.id,
        leave_at=now - timedelta(minutes=5),
        expire_at=now + timedelta(minutes=10),
        status="leaving",
    )

    checkin_record = CheckInRecord(
        user_id=users["student3"].id,
        seat_id=seats["A-003"].id,
        reservation_id=using_reservation.id,
        checkin_at=today_start,
        result="success",
    )

    finished_sessions = []
    finished_reservations = []
    demo_user = users["student"]
    for day_offset, duration in [(0, 90), (1, 120), (2, 60), (4, 150), (6, 80)]:
        start_at = now - timedelta(days=day_offset, hours=duration // 60 + 1)
        end_at = start_at + timedelta(minutes=duration)
        seat = seats[f"B-{day_offset + 1:03d}"]
        reservation = Reservation(
            user_id=demo_user.id,
            seat_id=seat.id,
            status="checked_in",
            reserve_time=start_at.time().replace(second=0, microsecond=0),
            start_time=start_at.time().replace(second=0, microsecond=0),
            end_time=end_at.time().replace(second=0, microsecond=0),
            reserved_at=start_at - timedelta(minutes=20),
            expire_at=start_at + timedelta(minutes=15),
            checkin_at=start_at,
        )
        finished_reservations.append(reservation)
        finished_sessions.append(
            StudySession(
                user_id=demo_user.id,
                seat_id=seat.id,
                reservation=reservation,
                status="released",
                start_at=start_at,
                end_at=end_at,
            )
        )

    violations = [
        Violation(
            user_id=demo_user.id,
            seat_id=seats["B-008"].id,
            violation_type="reservation_timeout",
            description="Demo reservation timeout record.",
            handle_status="unhandled",
            created_at=now - timedelta(days=3),
        ),
        Violation(
            user_id=users["student2"].id,
            seat_id=seats["B-009"].id,
            violation_type="leave_timeout",
            description="Demo temporary leave timeout record.",
            handle_status="handled",
            handled_at=now - timedelta(days=1),
            created_at=now - timedelta(days=2),
        ),
    ]

    db.session.add_all([leave_record, checkin_record])
    db.session.add_all(finished_reservations)
    db.session.add_all(finished_sessions)
    db.session.add_all(violations)


def init_database():
    app = create_app()
    with app.app_context():
        db.drop_all()
        db.create_all()
        users = seed_demo_users()
        seats = seed_demo_seats()
        seed_open_time_config()
        seed_demo_business_data(users, seats)
        db.session.commit()
        print("Database initialized successfully.")
        print("Demo seats inserted:", Seat.query.count())
        print("Default user: student / 123456")
        print("Default admin: admin / admin123")


if __name__ == "__main__":
    init_database()
