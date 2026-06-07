from datetime import date, timedelta

from dao.report_dao import count_violations_by_user, find_finished_sessions_by_user


def _duration_minutes(study_session):
    seconds = max(0, int((study_session.end_at - study_session.start_at).total_seconds()))
    return round(seconds / 60, 1)


def get_my_report(user):
    sessions = find_finished_sessions_by_user(user.id)
    violation_count = count_violations_by_user(user.id)

    durations = [_duration_minutes(session) for session in sessions]
    total_duration = round(sum(durations), 1)
    session_count = len(sessions)
    average_duration = round(total_duration / session_count, 1) if session_count else 0

    today = date.today()
    daily_map = {
        today - timedelta(days=offset): 0
        for offset in range(6, -1, -1)
    }
    peak_hour_map = {hour: 0 for hour in range(24)}

    for session in sessions:
        session_day = session.start_at.date()
        if session_day in daily_map:
            daily_map[session_day] = round(daily_map[session_day] + _duration_minutes(session), 1)

        hour_label = session.start_at.hour
        peak_hour_map[hour_label] += 1

    daily_duration = [
        {"date": day.isoformat(), "duration": duration}
        for day, duration in daily_map.items()
    ]
    peak_hours = [
        {"hour": f"{hour:02d}:00", "count": count}
        for hour, count in peak_hour_map.items()
        if count > 0
    ]

    return {
        "total_duration": total_duration,
        "session_count": session_count,
        "average_duration": average_duration,
        "violation_count": violation_count,
        "daily_duration": daily_duration,
        "peak_hours": peak_hours,
    }
